"use client";
/** Carte abonnement : upgrade (Checkout, mensuel ou annuel) ou gestion (portail client). */
import { useState } from "react";

export function BillingCard({ plan }: { plan: string }) {
  const [busy, setBusy] = useState(false);
  const [annual, setAnnual] = useState(true);

  async function go(path: string, body?: object) {
    setBusy(true);
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
    const data = await res.json();
    setBusy(false);
    if (data.url) location.href = data.url;
    else alert(data.error ?? "Erreur");
  }

  const label = plan === "protege" ? "Protégé" : plan === "studio" ? "Studio" : "Gratuit";
  const interval = annual ? "annual" : "monthly";
  const price = (p: "protege" | "studio") =>
    annual ? (p === "protege" ? "90 €/an" : "190 €/an") : (p === "protege" ? "9 €/mois" : "19 €/mois");

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Abonnement</h2>
      <div className="rounded-2xl border border-ink-100 bg-paper p-5 text-sm">
        <div className="flex items-center justify-between">
          <p>Plan actuel : <span className="font-medium">{label}</span></p>
          {plan === "free" && (
            <div className="flex items-center gap-2 text-xs">
              <button onClick={() => setAnnual(false)} className={annual ? "text-ink-400" : "font-medium text-ink-900"}>Mensuel</button>
              <button onClick={() => setAnnual(!annual)} role="switch" aria-checked={annual} className="relative h-5 w-9 rounded-full bg-ink-200 transition">
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-orange transition-all ${annual ? "left-[1.125rem]" : "left-0.5"}`} />
              </button>
              <button onClick={() => setAnnual(true)} className={annual ? "font-medium text-ink-900" : "text-ink-400"}>
                Annuel <span className="text-orange">(2 mois offerts)</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {plan === "free" ? (
            <>
              <button disabled={busy} onClick={() => go("/api/billing/checkout", { plan: "protege", interval })}
                className="rounded-full bg-orange px-4 py-2 font-medium text-white transition hover:bg-orange-bright disabled:opacity-50">
                Passer à Protégé, {price("protege")}
              </button>
              <button disabled={busy} onClick={() => go("/api/billing/checkout", { plan: "studio", interval })}
                className="rounded-full border border-ink-200 px-4 py-2 font-medium transition hover:border-ink-400 disabled:opacity-50">
                Studio, {price("studio")}
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
