/**
 * Limites par plan (enforcement côté API, spec F8). Le plan gratuit fait « toucher »
 * la valeur sans la donner : 1 agent, 3 règles actives.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type Plan = "free" | "protege" | "studio";

export function maxAgents(plan: Plan): number {
  return plan === "studio" ? 5 : 1; // free & protégé : 1 agent
}

export function maxRules(plan: Plan): number {
  return plan === "free" ? 3 : Infinity;
}

/** Plan effectif de l'utilisateur (un abonnement annulé retombe en free). */
export async function planForUser(db: SupabaseClient, userId: string): Promise<Plan> {
  const { data } = await db.from("subscriptions").select("plan, status").eq("user_id", userId).single();
  if (!data || data.status === "canceled") return "free";
  return (data.plan as Plan) ?? "free";
}
