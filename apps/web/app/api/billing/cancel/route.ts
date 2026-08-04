/**
 * POST /api/billing/cancel, résilie l'abonnement de l'utilisateur EN FIN DE PÉRIODE
 * (accès conservé jusqu'à la date déjà payée). Le webhook Stripe mettra à jour la DB.
 */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data: sub } = await db.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).single();
  if (!sub?.stripe_customer_id) return NextResponse.json({ error: "aucun abonnement" }, { status: 404 });

  const list = await stripe(`/subscriptions?customer=${sub.stripe_customer_id}&status=active&limit=5`);
  const current = (list as { data?: Array<{ id: string }> }).data?.[0];
  if (!current) return NextResponse.json({ error: "aucun abonnement actif" }, { status: 404 });

  await stripe(`/subscriptions/${current.id}`, { cancel_at_period_end: "true" });
  return NextResponse.json({ ok: true });
}
