/**
 * Mise en conformité d'un compte avec son plan (appelée quand le plan baisse).
 * Empêche le bypass "je paie 1 mois, j'active 15 règles, je résilie et je les garde".
 * Idempotent : sans dépassement, ne touche rien.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { maxRules, type Plan } from "./plan";

export async function enforcePlanLimits(db: SupabaseClient, userId: string, plan: Plan) {
  const limit = maxRules(plan);
  if (!Number.isFinite(limit)) return { disabledRules: 0, clearedCaps: false };

  // 1. Règles : on garde les plus anciennes, on désactive le surplus.
  const { data: active } = await db
    .from("rules").select("id").eq("user_id", userId).eq("enabled", true)
    .order("created_at", { ascending: true });
  const excess = (active ?? []).slice(limit).map((r) => r.id);
  if (excess.length) await db.from("rules").update({ enabled: false }).in("id", excess);

  // 2. Plafonds de dépense : fonctionnalité payante, on les retire en gratuit.
  let clearedCaps = false;
  if (plan === "free") {
    await db.from("agents")
      .update({ daily_budget_eur: null, monthly_budget_eur: null })
      .eq("user_id", userId);
    clearedCaps = true;
  }

  return { disabledRules: excess.length, clearedCaps };
}
