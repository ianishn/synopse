/**
 * POST /api/rules/profile — active toutes les règles d'un profil en un clic (spec F2).
 * Body : { profile: "perso"|"commercant"|"builder" }.
 * Respecte la limite du plan : active autant de règles que possible, signale si tronqué.
 */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { RULES_CATALOG } from "@synopse/shared";
import { maxRules, planForUser } from "@/lib/plan";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { profile } = await request.json().catch(() => ({}));
  const templates = RULES_CATALOG.filter((t) => t.profiles.includes(profile));
  if (!templates.length) return NextResponse.json({ error: "profil inconnu" }, { status: 400 });

  const db = createServiceClient();
  const plan = await planForUser(db, user.id);
  const limit = maxRules(plan);

  // Règles déjà actives (comptent dans le quota).
  const { data: active } = await db.from("rules")
    .select("template_id").eq("user_id", user.id).eq("enabled", true);
  const alreadyOn = new Set((active ?? []).map((r) => r.template_id));
  let budget = Number.isFinite(limit) ? limit - alreadyOn.size : Infinity;

  const toActivate = [];
  let truncated = false;
  for (const t of templates) {
    if (alreadyOn.has(t.id)) continue;
    if (budget <= 0) { truncated = true; break; }
    toActivate.push({ user_id: user.id, template_id: t.id, enabled: true, severity: t.default_severity, agent_id: null, params_json: {} });
    budget--;
  }

  if (toActivate.length) {
    // Réactiver d'éventuelles règles désactivées de ce profil (enabled=false déjà en base).
    const { data: disabled } = await db.from("rules")
      .select("id, template_id").eq("user_id", user.id).eq("enabled", false)
      .in("template_id", toActivate.map((r) => r.template_id));
    const disabledByTpl = new Map((disabled ?? []).map((r) => [r.template_id, r.id]));
    const toInsert = toActivate.filter((r) => !disabledByTpl.has(r.template_id));
    const toReenable = [...disabledByTpl.values()];

    if (toReenable.length) await db.from("rules").update({ enabled: true }).in("id", toReenable);
    if (toInsert.length) {
      const { error } = await db.from("rules").insert(toInsert);
      if (error) return NextResponse.json({ error: "échec" }, { status: 500 });
    }
  }
  return NextResponse.json({
    ok: true,
    activated_ids: toActivate.map((r) => r.template_id),
    truncated,
    message: truncated
      ? `Plan gratuit : ${limit} règles max. Passe à Protégé pour activer tout le profil.`
      : undefined,
  });
}
