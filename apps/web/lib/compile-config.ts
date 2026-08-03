/**
 * Compilation des règles actives d'un agent en config plugin (spec F2).
 * Fusion : matcher = { ...template.matcher_json, ...rule.params_json } — les params
 * de l'user (ex. domain_allowlist enrichie) surchargent le template champ par champ.
 * Etag = sha256 du JSON (stable) → le plugin ne re-télécharge que si ça change.
 */
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Agent, CompiledConfig, Rule, RuleTemplate } from "@synopse/shared";

const APPROVAL_TIMEOUT_MS = 15 * 60_000;

export async function computeConfig(
  db: SupabaseClient,
  agent: Agent
): Promise<CompiledConfig> {
  const { data: rules } = await db
    .from("rules")
    .select("*, rule_templates(*)")
    .eq("user_id", agent.user_id)
    .eq("enabled", true);

  const compiled = ((rules ?? []) as Array<Rule & { rule_templates: RuleTemplate | null }>)
    .filter((r) => !r.agent_id || r.agent_id === agent.id)
    .map((r) => ({
      rule_id: r.id,
      severity: r.severity,
      matcher: { ...(r.rule_templates?.matcher_json ?? {}), ...(r.params_json ?? {}) },
      label_fr: r.rule_templates?.label_fr ?? String((r.params_json as { label_fr?: string })?.label_fr ?? "Règle personnalisée"),
    }));

  // F4 : budget dépassé → règle système "tout en confirm" (matcher vide = matche tout).
  // Incluse dans le body → l'etag change au franchissement → le plugin la récupère (≤ 30 s).
  if (agent.daily_budget_eur || agent.monthly_budget_eur) {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 8) + "01";
    const { data: rows } = await db.from("spend").select("day, est_cost_eur")
      .eq("agent_id", agent.id).gte("day", monthStart);
    const dayCost = (rows ?? []).filter((r: { day: string }) => r.day === today)
      .reduce((s: number, r: { est_cost_eur: number }) => s + Number(r.est_cost_eur), 0);
    const monthCost = (rows ?? []).reduce((s: number, r: { est_cost_eur: number }) => s + Number(r.est_cost_eur), 0);
    if ((agent.daily_budget_eur && dayCost >= agent.daily_budget_eur) ||
        (agent.monthly_budget_eur && monthCost >= agent.monthly_budget_eur)) {
      compiled.unshift({
        rule_id: "system-budget",
        severity: "confirm",
        matcher: {},
        label_fr: "Budget dépassé — chaque action doit être validée",
      });
    }
  }

  const body = {
    agent_status: agent.status,
    rules: compiled,
    approval_timeout_ms: APPROVAL_TIMEOUT_MS,
  };
  const etag = createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 16);
  return { etag, ...body };
}
