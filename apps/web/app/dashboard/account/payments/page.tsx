/** Compte > Paiements : historique des factures (Stripe). */
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type Invoice = { id: string; created: number; amount_paid: number; currency: string; status: string; hosted_invoice_url?: string; invoice_pdf?: string };

const STATUS: Record<string, string> = { paid: "Payée", open: "En attente", void: "Annulée", uncollectible: "Impayée", draft: "Brouillon" };

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const db = createServiceClient();
  const { data: sub } = await db.from("subscriptions").select("stripe_customer_id").eq("user_id", user!.id).single();

  let invoices: Invoice[] = [];
  if (sub?.stripe_customer_id) {
    try {
      const list = await stripe(`/invoices?customer=${sub.stripe_customer_id}&limit=24`);
      invoices = ((list as { data?: Invoice[] }).data ?? []).filter((i) => i.status !== "draft");
    } catch { /* Stripe indisponible */ }
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-paper">
      <div className="border-b border-ink-100 px-6 py-4">
        <h2 className="font-semibold text-off">Historique des paiements</h2>
        <p className="mt-1 text-sm text-ink-400">Tes factures et reçus.</p>
      </div>
      {invoices.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-ink-400">Aucun paiement pour l&apos;instant.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Montant</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Facture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-6 py-3">{new Date(inv.created * 1000).toLocaleDateString("fr-FR")}</td>
                  <td className="px-6 py-3 font-medium text-off">{(inv.amount_paid / 100).toFixed(2)} {inv.currency.toUpperCase()}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.status === "paid" ? "bg-[var(--orange-soft)] text-orange" : "bg-ink-100 text-ink-400"}`}>
                      {STATUS[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {inv.hosted_invoice_url
                      ? <a className="font-medium text-orange hover:text-orange-bright" href={inv.hosted_invoice_url} target="_blank" rel="noreferrer">Voir</a>
                      : <span className="text-ink-400">·</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
