"use client";
/** Panneau agents : statut, coût du jour, kill switch, connexion d'un nouvel agent. */
import { useState } from "react";
import { useRouter } from "next/navigation";

type AgentRow = {
  id: string; name: string; status: string;
  last_heartbeat_at: string | null; daily_budget_eur: number | null;
};

export function AgentsPanel({ agents, spendByAgent }: { agents: AgentRow[]; spendByAgent: Record<string, number> }) {
  const router = useRouter();
  const [pairing, setPairing] = useState<{ token: string; telegram_link_url: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggleFreeze(a: AgentRow) {
    setBusy(true);
    await fetch(`/api/agents/${a.id}/freeze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ frozen: a.status !== "frozen" }),
    });
    setBusy(false);
    router.refresh();
  }

  async function connect() {
    setBusy(true);
    const res = await fetch("/api/pairing", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    const data = await res.json();
    setBusy(false);
    if (res.ok) { setPairing(data); router.refresh(); }
    else alert(data.error ?? "Erreur");
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
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Agents</h2>
      {agents.map((a) => (
        <div key={a.id} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-paper p-5">
          <div>
            <p className="flex items-center gap-3 font-medium">{a.name} {badge(a.status)}</p>
            <p className="mt-1 text-sm text-ink-500">
              Aujourd&apos;hui : {(spendByAgent[a.id] ?? 0).toFixed(2)} €
              {a.daily_budget_eur ? ` / ${a.daily_budget_eur} €` : ""}
              {a.last_heartbeat_at ? ` · vu ${new Date(a.last_heartbeat_at).toLocaleTimeString("fr-FR")}` : " · jamais vu"}
            </p>
          </div>
          <button disabled={busy} onClick={() => toggleFreeze(a)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
              a.status === "frozen"
                ? "bg-mint-500 text-white hover:bg-mint-400"
                : "border border-ink-200 text-ink-700 hover:border-red-300 hover:text-red-600"
            }`}>
            {a.status === "frozen" ? "Dégeler" : "Tout geler"}
          </button>
        </div>
      ))}

      {pairing ? (
        <div className="space-y-3 rounded-2xl border border-mint-300 bg-mint-50 p-5 text-sm">
          <p className="font-medium text-ink-900">Token affiché une seule fois — configure ton agent :</p>
          <code className="block overflow-x-auto rounded-lg bg-ink-950 p-3 font-mono text-xs text-mint-300">
            SYNOPSE_AGENT_TOKEN={pairing.token}
          </code>
          <a className="inline-flex items-center gap-1 font-medium text-ink-900 hover:text-mint-500"
            href={pairing.telegram_link_url} target="_blank" rel="noreferrer">
            Relier Telegram <span aria-hidden>→</span>
          </a>
        </div>
      ) : (
        <button disabled={busy} onClick={connect}
          className="w-full rounded-2xl border border-dashed border-ink-300 py-4 text-sm font-medium text-ink-500 transition hover:border-mint-400 hover:text-ink-900 disabled:opacity-50">
          + Connecter un agent
        </button>
      )}
    </section>
  );
}
