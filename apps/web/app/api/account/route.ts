/**
 * DELETE /api/account — supprime le compte de l'utilisateur connecté.
 * Annule d'abord tout abonnement Stripe (pour ne plus facturer), puis supprime l'utilisateur
 * Auth (cascade DB : agents, règles, abonnements, events… partent via FK on delete cascade).
 */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data: sub } = await db.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).single();

  // Résilier les abonnements Stripe actifs (best-effort).
  if (sub?.stripe_customer_id) {
    try {
      const list = await stripe(`/subscriptions?customer=${sub.stripe_customer_id}&status=active&limit=10`);
      for (const s of (list as { data?: Array<{ id: string }> }).data ?? []) {
        await stripe(`/subscriptions/${s.id}`, { cancel_at_period_end: "false" }).catch(() => {});
        await fetch(`https://api.stripe.com/v1/subscriptions/${s.id}`, {
          method: "DELETE", headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
        }).catch(() => {});
      }
    } catch { /* ignore : la suppression du compte prime */ }
  }

  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "échec suppression" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
