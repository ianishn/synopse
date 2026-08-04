"use client";
/** Zone de gestion des agents : nom, statut, coût du jour, geler/dégeler, supprimer. */
import { useState } from "react";
import { useRouter } from "next/navigation";

type AgentRow = {
  id: string; name: string; status: string;
  last_heartbeat_at: string | null; daily_budget_eur: number | null;
};

export function AgentsPanel({ agents, spendByAgent }: { agents: AgentRow[]; spendByAgent: Record<string, number> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function toggleFreeze(a: AgentRow) {
    setBusy(true);
    await fetch(`/api/agents/${a.id}/freeze`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ frozen: a.status !== "frozen" }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove(a: AgentRow) {
    setBusy(true);
    const res = await fetch(`/api/agents/${a.id}`, { method: "DELETE" });
    setBusy(false);
    setConfirmId(null);
    if (res.ok) router.refresh();
    else alert("Suppression impossible");
  }

  const badge = (s: string) => {
    const map: Record<string, { dot: string; label: string }> = {
      frozen: { dot: "bg-sky-400", label: "Gelé" },
      silent: { dot: "bg-amber-400", label: "Injoignable" },
      active: { dot: "bg-mint-500", label: "Actif" },
    };
    const b = map[s] ?? map.active;
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-ink-500">
        <span className={`h-2 w-2 rounded-full ${b.dot}`} />{b.label}
      </span>
    );
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Mes agents</h2>
        <a href="/dashboard/connect" className="text-sm font-medium text-mint-500 hover:text-mint-400">+ Connecter un agent</a>
      </div>

      {agents.length === 0 && (
        <a href="/dashboard/connect"
          className="block rounded-2xl border border-dashed border-ink-300 py-8 text-center text-sm text-ink-500 transition hover:border-mint-400 hover:text-ink-900">
          Aucun agent connecté. <span className="font-medium text-mint-500">Connecte ton premier agent →</span>
        </a>
      )}

      {agents.map((a) => (
        <div key={a.id} className="rounded-2xl border border-ink-100 bg-paper p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-3 font-medium">{a.name} {badge(a.status)}</p>
              <p className="mt-1 text-sm text-ink-500">
                Aujourd&apos;hui : {(spendByAgent[a.id] ?? 0).toFixed(2)} €
                {a.daily_budget_eur ? ` / ${a.daily_budget_eur} €` : ""}
                {a.last_heartbeat_at ? ` · vu ${new Date(a.last_heartbeat_at).toLocaleTimeString("fr-FR")}` : " · jamais vu"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button disabled={busy} onClick={() => toggleFreeze(a)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                  a.status === "frozen"
                    ? "bg-mint-500 text-white hover:bg-mint-400"
                    : "border border-ink-200 text-ink-700 hover:border-red-500/50 hover:text-red-400"
                }`}>
                {a.status === "frozen" ? "Dégeler" : "Geler"}
              </button>
              <button disabled={busy} onClick={() => setConfirmId(confirmId === a.id ? null : a.id)}
                aria-label={`Supprimer ${a.name}`}
                className="rounded-full border border-ink-200 px-3 py-2 text-sm text-ink-500 transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-50">
                Supprimer
              </button>
            </div>
          </div>

          {confirmId === a.id && (
            <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center">
              <span className="text-red-300">Supprimer « {a.name} » et tout son historique ? Irréversible.</span>
              <div className="flex shrink-0 gap-2">
                <button disabled={busy} onClick={() => remove(a)}
                  className="rounded-full bg-red-600 px-4 py-1.5 font-medium text-white transition hover:bg-red-500/100 disabled:opacity-50">
                  Oui, supprimer
                </button>
                <button disabled={busy} onClick={() => setConfirmId(null)}
                  className="rounded-full border border-ink-200 px-4 py-1.5 transition hover:border-ink-400">
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
