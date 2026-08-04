"use client";
/** Réglage du plafond journalier / mensuel (€), appliqué à tous les agents. */
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CapEditor({ daily, monthly }: { daily: number | null; monthly: number | null }) {
  const router = useRouter();
  const [d, setD] = useState(daily?.toString() ?? "");
  const [m, setM] = useState(monthly?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true); setSaved(false);
    await fetch("/api/spend/cap", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ daily: d, monthly: m }) });
    setBusy(false); setSaved(true); router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  const input = "w-24 rounded-lg border border-line bg-void-2 px-3 py-1.5 font-mono text-sm text-off outline-none focus:border-orange";
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-xs text-muted">Plafond / jour (€)</span>
        <input className={input} type="number" min="0" step="1" value={d} onChange={(e) => setD(e.target.value)} placeholder="illimité" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs text-muted">Plafond / mois (€)</span>
        <input className={input} type="number" min="0" step="1" value={m} onChange={(e) => setM(e.target.value)} placeholder="illimité" />
      </label>
      <button disabled={busy} onClick={save} className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-bright disabled:opacity-50">
        {busy ? "…" : saved ? "Enregistré ✓" : "Enregistrer"}
      </button>
    </div>
  );
}
