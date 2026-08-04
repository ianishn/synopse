/**
 * Tableau de bord Synopse, salle de contrôle (charte V1.0). 8 modules dans l'ordre du brief.
 * Données réelles Supabase ; états vide/chargement/erreur gérés par module.
 */
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { maxAgents, planForUser } from "@/lib/plan";
import { stripe } from "@/lib/stripe";
import { RULES_CATALOG } from "@synopse/shared";
import { AgentsPanel } from "./agents-panel";
import { PendingActions } from "./pending-actions";
import { KillSwitch, FrozenBanner } from "./kill-switch";
import { SpendPanel } from "./spend-panel";
import { RulesSummary } from "./rules-summary";
import { SubscriptionRecap } from "./subscription-recap";
import { TutorialModal } from "./tutorial-modal";

export const dynamic = "force-dynamic";

const VERDICT: Record<string, { dot: string; label: string; cls: string }> = {
  blocked: { dot: "bg-red-500", label: "Bloqué", cls: "text-red-400" },
  denied: { dot: "bg-red-500", label: "Refusé", cls: "text-red-400" },
  approved: { dot: "bg-green-500", label: "Validé", cls: "text-green-400" },
  budget_alert: { dot: "bg-amber-500", label: "Budget", cls: "text-amber-400" },
};

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = isAdmin(user.email);

  const db = createServiceClient();
  const plan = await planForUser(db, user.id);

  const { data: agentsRaw } = await db.from("agents")
    .select("id, name, status, last_heartbeat_at, daily_budget_eur, monthly_budget_eur")
    .eq("user_id", user.id).order("created_at");
  const agents = agentsRaw ?? [];
  const ids = agents.map((a) => a.id);
  const names = Object.fromEntries(agents.map((a) => [a.id, a.name]));

  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const monthStart = new Date().toISOString().slice(0, 8) + "01";

  // Chargements en parallèle
  const [{ data: events30 }, { data: spendRows }, { data: pendingRows }, { data: rulesRows }, { data: recent }, { data: subRow }] = await Promise.all([
    ids.length ? db.from("events").select("agent_id, type").in("agent_id", ids).gte("created_at", since30) : Promise.resolve({ data: [] }),
    ids.length ? db.from("spend").select("agent_id, day, est_cost_eur").in("agent_id", ids).gte("day", monthStart) : Promise.resolve({ data: [] }),
    ids.length ? db.from("approvals").select("id, agent_id, rule_id, action_summary, created_at, expires_at").in("agent_id", ids).eq("status", "pending").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    db.from("rules").select("id, template_id, severity, enabled").eq("user_id", user.id),
    ids.length ? db.from("events").select("id, agent_id, type, summary_fr, created_at").in("agent_id", ids).neq("type", "usage").order("created_at", { ascending: false }).limit(8) : Promise.resolve({ data: [] }),
    db.from("subscriptions").select("plan, status, stripe_customer_id").eq("user_id", user.id).single(),
  ]);

  // Métriques par agent
  const actionTypes = new Set(["blocked", "approved", "denied", "info"]);
  const metrics = new Map(ids.map((id) => [id, { actions30d: 0, interceptions: 0, monthCost: 0 }]));
  for (const e of events30 ?? []) {
    const m = metrics.get(e.agent_id); if (!m) continue;
    if (actionTypes.has(e.type)) m.actions30d++;
    if (e.type === "blocked" || e.type === "denied") m.interceptions++;
  }
  for (const s of spendRows ?? []) { const m = metrics.get(s.agent_id); if (m) m.monthCost += Number(s.est_cost_eur); }

  const agentRows = agents.map((a) => ({
    id: a.id, name: a.name, status: a.status, last_heartbeat_at: a.last_heartbeat_at,
    daily_budget_eur: a.daily_budget_eur,
    actions30d: metrics.get(a.id)?.actions30d ?? 0,
    interceptions: metrics.get(a.id)?.interceptions ?? 0,
    monthCost: metrics.get(a.id)?.monthCost ?? 0,
  }));

  // Dépenses : total mois, par jour (30 j), par agent
  const monthTotal = (spendRows ?? []).reduce((s, r) => s + Number(r.est_cost_eur), 0);
  const dayMap = new Map<string, number>();
  for (const s of spendRows ?? []) dayMap.set(s.day, (dayMap.get(s.day) ?? 0) + Number(s.est_cost_eur));
  const daily = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day: d, eur: dayMap.get(d) ?? 0 };
  });
  const perAgentSpend = agentRows.filter((a) => a.monthCost > 0).map((a) => ({ name: a.name, eur: a.monthCost }))
    .sort((x, y) => y.eur - x.eur);
  const monthlyCap = agents.find((a) => a.monthly_budget_eur)?.monthly_budget_eur ?? null;
  const dailyCap = agents.find((a) => a.daily_budget_eur)?.daily_budget_eur ?? null;

  // Approbations en attente enrichies
  const ruleIdsP = [...new Set((pendingRows ?? []).map((r) => r.rule_id).filter(Boolean))];
  const { data: ruleTpl } = ruleIdsP.length
    ? await db.from("rules").select("id, rule_templates(label_fr)").in("id", ruleIdsP) : { data: [] };
  const ruleLabel = Object.fromEntries((ruleTpl ?? []).map((r) => [r.id, (r.rule_templates as unknown as { label_fr?: string })?.label_fr ?? "Règle"]));
  const pending = (pendingRows ?? []).map((r) => ({
    id: r.id, agent: names[r.agent_id] ?? "Agent", action_summary: r.action_summary,
    rule: r.rule_id ? ruleLabel[r.rule_id] ?? null : null, created_at: r.created_at, expires_at: r.expires_at,
  }));

  // Règles actives + déclenchements (approbations par rule_id)
  const { data: apprByRule } = ids.length
    ? await db.from("approvals").select("rule_id").in("agent_id", ids) : { data: [] };
  const trig = new Map<string, number>();
  for (const a of apprByRule ?? []) if (a.rule_id) trig.set(a.rule_id, (trig.get(a.rule_id) ?? 0) + 1);
  const tplLabel = Object.fromEntries(RULES_CATALOG.map((t) => [t.id, t.label_fr]));
  const rulesSummary = (rulesRows ?? []).map((r) => ({
    template_id: r.template_id ?? r.id,
    label: (r.template_id && tplLabel[r.template_id]) || "Règle personnalisée",
    severity: r.severity, enabled: r.enabled, triggers: trig.get(r.id) ?? 0,
  }));

  const sub = subRow && subRow.status !== "canceled" ? subRow : null;
  const planKey = (sub?.plan ?? "free") as "free" | "protege" | "studio";
  let renewal: string | null = null;
  if (sub?.stripe_customer_id) {
    try {
      const list = await stripe(`/subscriptions?customer=${sub.stripe_customer_id}&limit=3`);
      const cur = ((list as { data?: Array<Record<string, unknown>> }).data ?? []).find((s) => ["active", "trialing", "past_due"].includes(s.status as string));
      if (cur?.current_period_end) renewal = new Date((cur.current_period_end as number) * 1000).toLocaleDateString("fr-FR");
    } catch { /* ignore */ }
  }

  // Module 1 — état global
  const anyFrozen = agents.some((a) => a.status === "frozen");
  const anySilent = agents.some((a) => a.status === "silent");
  const capReached = monthlyCap != null && monthTotal >= monthlyCap;
  const incident = anyFrozen || anySilent || capReached;
  const header = anyFrozen
    ? { cls: "border-red-500/60 bg-red-500/10 text-red-300", dot: "bg-red-500", text: "Incident, tes agents sont gelés." }
    : anySilent ? { cls: "border-amber-500/50 bg-amber-500/10 text-amber-300", dot: "bg-amber-500", text: "Attention, un agent ne répond plus." }
    : capReached ? { cls: "border-amber-500/50 bg-amber-500/10 text-amber-300", dot: "bg-amber-500", text: "Plafond de dépense atteint." }
    : pending.length ? { cls: "border-amber-500/50 bg-amber-500/10 text-amber-300", dot: "bg-amber-500", text: `${pending.length} action(s) attendent ta validation.` }
    : { cls: "border-line bg-void text-s400", dot: "bg-green-500", text: "Tout va bien. Tes agents sont surveillés." };

  return (
    <div className="min-h-screen grid-bg">
      {anyFrozen && <FrozenBanner />}
      <header className="border-b border-line bg-void">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="font-display text-lg font-bold tracking-tight text-off">synopse<span className="text-orange">.</span></a>
          <div className="flex items-center gap-4 text-sm text-muted">
            {admin && <a className="font-medium text-orange hover:text-orange-bright" href="/admin">Admin</a>}
            <a className="hover:text-off" href="/dashboard/rules">Règles</a>
            <a className="hover:text-off" href="/dashboard/journal">Journal</a>
            <a className="hover:text-off" href="/dashboard/account">Compte</a>
            <form action="/auth/signout" method="post"><button className="hover:text-off">Se déconnecter</button></form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        {/* Module 1 — En-tête d'état */}
        <div className="flex items-center justify-between gap-4">
          <div className={`flex flex-1 items-center gap-3 rounded-xl border px-5 py-3.5 ${header.cls} ${incident ? "font-semibold" : ""}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${header.dot}`} />
            <span>{header.text}</span>
          </div>
          <TutorialModal />
        </div>

        {/* Module 2 — Action en attente (temps réel) */}
        <PendingActions initial={pending} />

        {/* Module 3 — Mes agents */}
        <AgentsPanel agents={agentRows} maxAgents={maxAgents(plan)} />

        {/* Module 4 — Règles actives */}
        <RulesSummary rules={rulesSummary} />

        {/* Module 5 — Dépenses & plafond */}
        <SpendPanel daily={daily} monthTotal={monthTotal} monthlyCap={monthlyCap} dailyCap={dailyCap} perAgent={perAgentSpend} plan={plan} />

        {/* Module 6 — Kill switch */}
        <KillSwitch frozen={anyFrozen} />

        {/* Module 7 — Journal */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Journal</h2>
            <a href="/dashboard/journal" className="text-sm font-medium text-orange hover:text-orange-bright">Tout voir · {plan === "free" ? "7 j" : "90 j"}</a>
          </div>
          {(recent ?? []).length === 0 ? (
            <div className="rounded-xl border border-line bg-void py-8 text-center text-sm text-muted">Aucun événement pour l&apos;instant.</div>
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-void">
              {(recent ?? []).map((e) => {
                const v = VERDICT[e.type] ?? { dot: "bg-muted", label: "Info", cls: "text-s400" };
                return (
                  <div key={e.id} className="grid grid-cols-[130px_1fr_auto] items-center gap-4 px-5 py-3 text-sm">
                    <span className="font-mono text-xs text-muted">{new Date(e.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="truncate text-s400"><span className="font-mono text-muted">{names[e.agent_id]}</span> · {e.summary_fr}</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${v.cls}`}><span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />{v.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Module 8 — Compte & abonnement */}
        <SubscriptionRecap plan={planKey} renewal={renewal} />
      </main>
    </div>
  );
}
