/** POST /api/billing/checkout, body { plan, interval? } → { url } (Stripe Checkout). */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, priceIdFor } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { plan, interval } = await request.json().catch(() => ({}));
  const price = priceIdFor(plan, interval === "annual" ? "annual" : "monthly");
  if (!price) return NextResponse.json({ error: "prix non configuré" }, { status: 500 });

  // Réutilise le customer Stripe existant (évite les doublons au 2e passage).
  const db = createServiceClient();
  const { data: sub } = await db.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).single();
  let customer = sub?.stripe_customer_id;
  if (!customer) {
    const c = await stripe("/customers", { email: user.email ?? "", "metadata[user_id]": user.id });
    customer = c.id as string;
    await db.from("subscriptions").upsert({ user_id: user.id, stripe_customer_id: customer, plan: "free", status: "active" });
  }

  const origin = new URL(request.url).origin;
  const session = await stripe("/checkout/sessions", {
    mode: "subscription",
    customer,
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    success_url: `${origin}/dashboard/bienvenue?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/account/billing`,
    "metadata[user_id]": user.id,
    "subscription_data[metadata][user_id]": user.id,
  });
  return NextResponse.json({ url: session.url });
}
