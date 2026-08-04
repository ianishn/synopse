"use client";
/** Module 3 — Mes agents : statut, dernier heartbeat, métriques 30 j, gestion. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlowCard } from "@/components/ui/glow-card";

type AgentRow = {
  id: string; name: string; status: string; last_heartbeat_at: string | null;
  actions30d: number; interceptions: number; monthCost: number; daily_budget_eur: number | null;
};

const STATUS: Record<string, { dot: string; label: string; cls: string }> = {
  active: { dot: "bg-green-500", label: "En ligne", cls: "text-green-400" },
  silent: { dot: "bg-amber-500", label: "Injoignable", cls: "text-amber-400" },
  frozen: { dot: "bg-red-500", label: "Gelé", cls: "text-red-400" },
};

function heartbeat(ts: string | null): string {
  if (!ts) return "jamais vu";
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `il y a ${s} s`;
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}

export function AgentsPanel({ agents, maxAgents }: { agents: AgentRow[]; maxAgents: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function toggleFreeze(a: AgentRow) {
    setBusy(true);
    await fetch(`/api/agents/${a.id}/freeze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ frozen: a.status !== "frozen" }) });
    setBusy(false); router.refresh();
  }
  async function remove(a: AgentRow) {
    setBusy(true);
    await fetch(`/api/agents/${a.id}`, { method: "DELETE" });
    setBusy(false); setConfirmId(null); router.refresh();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Mes agents <span className="ml-1 font-mono text-xs text-line">{agents.length}/{maxAgents === Infinity ? "∞" : maxAgents}</span>
        </h2>
        {agents.length < maxAgents && <a href="/dashboard/connect" className="text-sm font-medium text-orange hover:text-orange-bright">+ Connecter un agent</a>}
      </div>

      {agents.length === 0 && (
        <a href="/dashboard/connect" className="block rounded-xl border border-dashed border-line py-10 text-center text-sm text-muted transition hover:border-orange hover:text-off">
          Aucun agent connecté. <span className="font-medium text-orange">Connecte ton premier agent</span> pour le protéger en 3 minutes.
        </a>
      )}

      {agents.map((a) => {
        const st = STATUS[a.status] ?? STATUS.active;
        return (
          <GlowCard key={a.id} className="rounded-xl"><div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-off">{a.name}</span>
                <span className={`inline-flex items-center gap-1.5 text-sm ${st.cls}`}><span className={`h-2 w-2 rounded-full ${st.dot}`} />{st.label}</span>
                <span className="font-mono text-xs text-muted">· {heartbeat(a.last_heartbeat_at)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button disabled={busy} onClick={() => toggleFreeze(a)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${a.status === "frozen" ? "border border-line text-off hover:border-s400" : "border border-line text-muted hover:border-red-500/50 hover:text-red-400"}`}>
                  {a.status === "frozen" ? "Dégeler" : "Geler"}
                </button>
                <button disabled={busy} onClick={() => setConfirmId(confirmId === a.id ? null : a.id)}
                  className="rounded-full border border-line px-3.5 py-1.5 text-xs text-muted transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-50">Supprimer</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px border-t border-line bg-line/40">
              <div className="bg-void px-5 py-3"><div className="font-mono text-lg tabular-nums text-off">{a.actions30d.toLocaleString("fr-FR")}</div><div className="text-xs text-muted">Actions, 30 j</div></div>
              <div className="bg-void px-5 py-3"><div className="font-mono text-lg tabular-nums text-orange-bright">{a.interceptions}</div><div className="text-xs text-muted">Interceptions</div></div>
              <div className="bg-void px-5 py-3"><div className="font-mono text-lg tabular-nums text-off">{a.monthCost.toFixed(2)} €</div><div className="text-xs text-muted">Coût du mois</div></div>
            </div>
            {confirmId === a.id && (
              <div className="flex flex-col items-start justify-between gap-2 border-t border-line bg-red-500/5 px-5 py-3 text-sm sm:flex-row sm:items-center">
                <span className="text-red-300">Supprimer « {a.name} » et tout son historique ? Irréversible.</span>
                <div className="flex shrink-0 gap-2">
                  <button disabled={busy} onClick={() => remove(a)} className="rounded-full bg-red-600 px-4 py-1.5 font-medium text-white transition hover:bg-red-500 disabled:opacity-50">Oui, supprimer</button>
                  <button onClick={() => setConfirmId(null)} className="rounded-full border border-line px-4 py-1.5 transition hover:border-s400">Annuler</button>
                </div>
              </div>
            )}
          </div></GlowCard>
        );
      })}
    </section>
  );
}
