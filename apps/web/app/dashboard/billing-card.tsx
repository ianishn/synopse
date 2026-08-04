"use client";
/** Carte abonnement : upgrade (Checkout) ou gestion (portail client). */
import { useState } from "react";

export function BillingCard({ plan }: { plan: string }) {
  const [busy, setBusy] = useState(false);

  async function go(path: string, body?: object) {
    setBusy(true);
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
    const data = await res.json();
    setBusy(false);
    if (data.url) location.href = data.url;
    else alert(data.error ?? "Erreur");
  }

  const label = plan === "protege" ? "Protégé · 9 €/mois" : plan === "studio" ? "Studio · 19 €/mois" : "Gratuit";
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Abonnement</h2>
      <div className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-paper p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>Plan actuel : <span className="font-medium">{label}</span></p>
        <div className="flex flex-wrap gap-2">
          {plan === "free" ? (
            <>
              <button disabled={busy} onClick={() => go("/api/billing/checkout", { plan: "protege" })}
                className="rounded-full bg-orange px-4 py-2 font-medium text-white transition hover:bg-orange-bright disabled:opacity-50">
                Passer à Protégé, 9 €
              </button>
              <button disabled={busy} onClick={() => go("/api/billing/checkout", { plan: "studio" })}
                className="rounded-full border border-ink-200 px-4 py-2 font-medium transition hover:border-ink-400 disabled:opacity-50">
                Studio, 19 €
              </button>
            </>
          ) : (
            <button disabled={busy} onClick={() => go("/api/billing/portal")}
              className="rounded-full border border-ink-200 px-4 py-2 font-medium transition hover:border-ink-400 disabled:opacity-50">
              Gérer mon abonnement
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
