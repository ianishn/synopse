/**
 * Page de succès après achat. Confirme le paiement DIRECTEMENT auprès de Stripe et débloque
 * le plan en base (robuste : marche même si le webhook n'est pas encore configuré), puis
 * remercie et lance le tuto des nouvelles fonctionnalités.
 */
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { WelcomeTour } from "./welcome-tour";

export const dynamic = "force-dynamic";

export default async function BienvenuePage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { session_id } = await searchParams;

  let plan: "protege" | "studio" | "free" = "free";
  if (session_id) {
    try {
      const session = await stripe(`/checkout/sessions/${session_id}`) as {
        payment_status?: string; customer?: string; subscription?: string; metadata?: { user_id?: string };
      };
      // Sécurité : la session doit appartenir à l'utilisateur connecté et être payée.
      if (session.metadata?.user_id === user.id && session.payment_status === "paid" && session.subscription) {
        const sub = await stripe(`/subscriptions/${session.subscription}`) as { items?: { data?: Array<{ price?: { id?: string } }> } };
        plan = planFromPriceId(sub.items?.data?.[0]?.price?.id ?? "");
        const db = createServiceClient();
        await db.from("subscriptions").upsert({
          user_id: user.id, stripe_customer_id: session.customer, plan, status: "active",
        });
      }
    } catch { /* on affiche quand même la page ; le webhook rattrapera au besoin */ }
  }

  const planName = plan === "studio" ? "Studio" : "Protégé";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-void px-6 py-16 text-center text-off">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--orange-soft)] text-3xl">🎉</span>
      <p className="eyebrow mt-6">Bienvenue en {planName}</p>
      <h1 className="mt-3 text-3xl font-bold">Merci pour ton achat</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Ton plan {planName} est actif. Découvre en 30 secondes tout ce que tu viens de débloquer.
      </p>
      {plan !== "free" ? (
        <WelcomeTour plan={plan} />
      ) : (
        <a href="/dashboard" className="mt-8 rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-bright">
          Aller au tableau de bord
        </a>
      )}
    </div>
  );
}
