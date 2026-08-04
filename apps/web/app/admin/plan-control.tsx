"use client";
/** Contrôle admin : force le plan d'un utilisateur (outil de test). */
import { useState } from "react";
import { useRouter } from "next/navigation";

const PLANS: [string, string][] = [["free", "Gratuit"], ["protege", "Protégé"], ["studio", "Studio"]];

export function PlanControl({ userId, plan }: { userId: string; plan: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(plan);

  async function set(p: string) {
    if (p === current || busy) return;
    setBusy(true);
    const res = await fetch("/api/admin/set-plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user_id: userId, plan: p }) });
    setBusy(false);
    if (res.ok) { setCurrent(p); router.refresh(); }
    else alert("Échec");
  }

  return (
    <div className="inline-flex overflow-hidden rounded-full border border-ink-100">
      {PLANS.map(([k, label]) => (
        <button key={k} disabled={busy} onClick={() => set(k)}
          className={`px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${current === k ? "bg-[var(--orange-soft)] text-orange" : "text-ink-400 hover:text-off"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}
