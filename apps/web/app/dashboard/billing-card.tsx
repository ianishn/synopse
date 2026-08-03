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

  const label = plan === "protege" ? "Protégé (9 €/mois)" : plan === "studio" ? "Studio (19 €/mois)" : "Gratuit";
  return (
    <div className="flex items-center justify-between rounded border p-4 text-sm">
      <p>Plan : <span className="font-medium">{label}</span></p>
      <div className="flex gap-2">
        {plan === "free" ? (
          <>
            <button disabled={busy} onClick={() => go("/api/billing/checkout", { plan: "protege" })}
              className="rounded bg-black px-3 py-2 font-medium text-white dark:bg-white dark:text-black">
              Passer à Protégé — 9 €/mois
            </button>
            <button disabled={busy} onClick={() => go("/api/billing/checkout", { plan: "studio" })}
              className="rounded border px-3 py-2">Studio — 19 €</button>
          </>
        ) : (
          <button disabled={busy} onClick={() => go("/api/billing/portal")} className="rounded border px-3 py-2">
            Gérer mon abonnement
          </button>
        )}
      </div>
    </div>
  );
}
