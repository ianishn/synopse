/** Compte > Facturation. */
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { BillingManager } from "./billing-manager";
import { getLang } from "@/lib/lang-server";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const lang = await getLang();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const db = createServiceClient();
  const { data: sub } = await db.from("subscriptions").select("plan, status, stripe_customer_id").eq("user_id", user!.id).single();
  const plan = sub && sub.status !== "canceled" ? sub.plan : "free";

  // Détails Stripe de l'abonnement en cours (renouvellement, résiliation programmée).
  let renewal: string | null = null;
  let cancelAtEnd = false;
  if (sub?.stripe_customer_id) {
    try {
      const list = await stripe(`/subscriptions?customer=${sub.stripe_customer_id}&limit=5`);
      const current = ((list as { data?: Array<Record<string, unknown>> }).data ?? [])
        .find((s) => ["active", "trialing", "past_due"].includes(s.status as string));
      if (current) {
        renewal = current.current_period_end ? new Date((current.current_period_end as number) * 1000).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR") : null;
        cancelAtEnd = Boolean(current.cancel_at_period_end);
      }
    } catch { /* Stripe indisponible : on affiche l'essentiel depuis la DB */ }
  }

  return <BillingManager plan={plan} status={sub?.status ?? "active"} renewal={renewal} cancelAtEnd={cancelAtEnd} lang={lang} />;
}
