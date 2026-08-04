/**
 * POST /api/stripe/webhook, synchronise `subscriptions` (source de vérité : Stripe).
 * Événements gérés : checkout.session.completed, customer.subscription.updated/deleted.
 * Prod : configurer l'endpoint dans Stripe Dashboard + STRIPE_WEBHOOK_SECRET dans Vercel.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { planFromPriceId, stripe, verifyStripeSignature } from "@/lib/stripe";
import { enforcePlanLimits } from "@/lib/enforce-plan";
import type { Plan } from "@/lib/plan";

export async function POST(request: Request) {
  const payload = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (secret) {
    if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret)) {
      return NextResponse.json({ error: "bad signature" }, { status: 400 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Fail-closed : sans secret en prod, on REFUSE (sinon un événement forgé = escalade de plan).
    console.error("[stripe] STRIPE_WEBHOOK_SECRET manquant en production, webhook refusé");
    return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
  } else {
    console.warn("[stripe] STRIPE_WEBHOOK_SECRET absent, signature non vérifiée (dev uniquement)");
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
    let userId: string | undefined = obj.metadata?.user_id;
    if (userId) {
      await db.from("subscriptions").upsert({ user_id: userId, stripe_customer_id: obj.customer, ...patch });
    } else {
      const { data } = await db.from("subscriptions").update(patch).eq("stripe_customer_id", obj.customer).select("user_id").single();
      userId = data?.user_id;
    }
    // Plan qui baisse : on remet le compte en conformité (règles en trop désactivées,
    // plafonds retirés en gratuit). Sinon l'utilisateur garderait ses avantages.
    if (userId) await enforcePlanLimits(db, userId, patch.plan as Plan);
  }

  return NextResponse.json({ received: true });
}
