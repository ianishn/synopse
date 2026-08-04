/** POST /api/billing/portal, portail client Stripe (changer/annuler l'abonnement). */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data: sub } = await db.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).single();
  if (!sub?.stripe_customer_id) return NextResponse.json({ error: "aucun abonnement" }, { status: 404 });

  const session = await stripe("/billing_portal/sessions", {
    customer: sub.stripe_customer_id,
    return_url: `${new URL(request.url).origin}/dashboard`,
  });
  return NextResponse.json({ url: session.url });
}
