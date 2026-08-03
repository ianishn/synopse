/**
 * POST /api/rules — active/désactive une règle (par template). Body : { template_id, enabled }.
 * Enable = upsert enabled:true (sévérité = défaut du template). Disable = enabled:false.
 * Limite plan gratuit : 3 règles actives max (enforcée ici, pas seulement dans l'UI).
 */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { maxRules, planForUser } from "@/lib/plan";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { template_id, enabled } = await request.json().catch(() => ({}));
  if (!template_id || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: tpl } = await db.from("rule_templates").select("id, default_severity").eq("id", template_id).single();
  if (!tpl) return NextResponse.json({ error: "règle inconnue" }, { status: 404 });

  if (enabled) {
    const plan = await planForUser(db, user.id);
    const limit = maxRules(plan);
    if (Number.isFinite(limit)) {
      // Compte les règles actives, hors celle qu'on (ré)active.
      const { data: active } = await db.from("rules")
        .select("template_id").eq("user_id", user.id).eq("enabled", true);
      const count = (active ?? []).filter((r) => r.template_id !== template_id).length;
      if (count >= limit) {
        return NextResponse.json(
          { error: `Le plan gratuit est limité à ${limit} règles actives. Passe à Protégé pour en activer plus.`, code: "limit" },
          { status: 403 }
        );
      }
    }
  }

  // Vérifier-puis-agir (pas d'upsert : évite d'exiger une contrainte unique DB).
  const { data: existing } = await db.from("rules")
    .select("id").eq("user_id", user.id).eq("template_id", template_id).maybeSingle();
  const { error } = existing
    ? await db.from("rules").update({ enabled }).eq("id", existing.id)
    : await db.from("rules").insert({
        user_id: user.id, template_id, enabled, severity: tpl.default_severity, agent_id: null, params_json: {},
      });
  if (error) return NextResponse.json({ error: "échec" }, { status: 500 });
  return NextResponse.json({ ok: true, enabled });
}
