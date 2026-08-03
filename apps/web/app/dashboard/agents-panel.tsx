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

  const badge = (s: string) =>
    s === "frozen" ? "🧊 Gelé" : s === "silent" ? "⚠️ Injoignable" : "🟢 Actif";

  return (
    <section className="space-y-4">
      {agents.map((a) => (
        <div key={a.id} className="flex items-center justify-between rounded border p-4">
          <div>
            <p className="font-medium">{a.name} <span className="ml-2 text-sm">{badge(a.status)}</span></p>
            <p className="text-sm opacity-70">
              Aujourd&apos;hui : {(spendByAgent[a.id] ?? 0).toFixed(2)} €
              {a.daily_budget_eur ? ` / ${a.daily_budget_eur} €` : ""}
              {a.last_heartbeat_at ? ` · vu ${new Date(a.last_heartbeat_at).toLocaleTimeString("fr-FR")}` : " · jamais vu"}
            </p>
          </div>
          <button disabled={busy} onClick={() => toggleFreeze(a)}
            className={`rounded px-3 py-2 text-sm font-medium text-white ${a.status === "frozen" ? "bg-green-600" : "bg-red-600"}`}>
            {a.status === "frozen" ? "▶️ Dégeler" : "🧊 Tout geler"}
          </button>
        </div>
      ))}

      {pairing ? (
        <div className="space-y-2 rounded border border-amber-400 bg-amber-50 p-4 text-sm dark:bg-amber-950">
          <p className="font-medium">⚠️ Token affiché une seule fois — configure ton agent :</p>
          <code className="block overflow-x-auto rounded bg-black/80 p-2 text-white">SYNOPSE_AGENT_TOKEN={pairing.token}</code>
          <p><a className="underline" href={pairing.telegram_link_url} target="_blank">Relier Telegram →</a></p>
        </div>
      ) : (
        <button disabled={busy} onClick={connect} className="w-full rounded border border-dashed p-3 text-sm">
          + Connecter un agent
        </button>
      )}
    </section>
  );
}
