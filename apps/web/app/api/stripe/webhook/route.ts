/**
 * POST /api/stripe/webhook — synchronise `subscriptions` (source de vérité : Stripe).
 * Événements gérés : checkout.session.completed, customer.subscription.updated/deleted.
 * Prod : configurer l'endpoint dans Stripe Dashboard + STRIPE_WEBHOOK_SECRET dans Vercel.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { planFromPriceId, stripe, verifyStripeSignature } from "@/lib/stripe";

export async function POST(request: Request) {
  const payload = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (secret) {
    if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret)) {
      return NextResponse.json({ error: "bad signature" }, { status: 400 });
    }
  } else {
    console.warn("[stripe] STRIPE_WEBHOOK_SECRET absent — signature non vérifiée (dev uniquement)");
  }

  const event = JSON.parse(payload);
  const db = createServiceClient();
  const obj = event.data?.object ?? {};

  if (event.type === "checkout.session.completed" && obj.mode === "subscription") {
    // Le plan précis arrive via customer.subscription.updated ; on lit la subscription tout de suite.
    const sub = await stripe(`/subscriptions/${obj.subscription}`);
    const priceId = (sub as { items?: { data?: Array<{ price?: { id?: string } }> } }).items?.data?.[0]?.price?.id ?? "";
    await db.from("subscriptions").upsert({
      user_id: obj.metadata?.user_id,
      stripe_customer_id: obj.customer,
      plan: planFromPriceId(priceId),
      status: "active",
    });
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const priceId = obj.items?.data?.[0]?.price?.id ?? "";
    const active = event.type !== "customer.subscription.deleted" && ["active", "trialing", "past_due"].includes(obj.status);
    const patch = {
      plan: active ? planFromPriceId(priceId) : "free",
      status: active ? obj.status : "canceled",
    };
    if (obj.metadata?.user_id) {
      await db.from("subscriptions").upsert({ user_id: obj.metadata.user_id, stripe_customer_id: obj.customer, ...patch });
    } else {
      await db.from("subscriptions").update(patch).eq("stripe_customer_id", obj.customer);
    }
  }

  return NextResponse.json({ received: true });
}
