"use client";
/**
 * Module 2 — Actions en attente, temps réel (Supabase Realtime sur la table approvals).
 * La même approbation se résout depuis le dashboard OU depuis Telegram.
 */
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Pending = { id: string; agent: string; action_summary: string; rule: string | null; created_at: string; expires_at: string };

function Countdown({ expires }: { expires: string }) {
  const [left, setLeft] = useState(() => Math.max(0, Math.floor((new Date(expires).getTime() - Date.now()) / 1000)));
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(left / 60), r = left % 60;
  return <span className="rounded-md border border-line bg-void-2 px-2 py-1 font-mono text-sm tabular-nums text-off">{m}:{r < 10 ? "0" : ""}{r}</span>;
}

export function PendingActions({ initial }: { initial: Pending[] }) {
  const [items, setItems] = useState<Pending[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const res = await fetch("/api/approvals");
    if (res.ok) setItems((await res.json()).pending);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel("approvals-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "approvals" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  async function decide(id: string, verdict: "approved" | "denied") {
    setBusy(id);
    setItems((x) => x.filter((i) => i.id !== id)); // optimiste
    await fetch(`/api/approvals/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verdict }) });
    setBusy(null);
    refetch();
  }

  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-400">
        <span className="h-2 w-2 rounded-full bg-amber-500" /> {items.length} action{items.length > 1 ? "s" : ""} en attente de ta validation
      </h2>
      {items.map((it) => (
        <div key={it.id} className="rounded-xl border border-orange bg-void shadow-[0_0_0_1px_var(--orange),0_20px_50px_-30px_rgba(234,88,12,0.5)]">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-off"><span className="h-2 w-2 rounded-full bg-amber-500" /> {it.agent}</span>
            <Countdown expires={it.expires_at} />
          </div>
          <div className="px-5 py-4">
            <p className="text-off">{it.action_summary}</p>
            {it.rule && <p className="mt-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-orange/30 bg-[var(--orange-soft)] px-2.5 py-0.5 text-xs font-medium text-orange-bright">Règle : {it.rule}</span></p>}
            {detail === it.id && (
              <p className="mt-3 rounded-lg border border-line bg-void-2 p-3 font-mono text-xs text-muted">
                Reçue le {new Date(it.created_at).toLocaleString("fr-FR")} · refus automatique à l&apos;expiration du compte à rebours (fail-safe).
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 px-5 pb-4">
            <button disabled={busy === it.id} onClick={() => decide(it.id, "denied")}
              className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-bright disabled:opacity-50">Refuser</button>
            <button disabled={busy === it.id} onClick={() => decide(it.id, "approved")}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-off transition hover:border-s400 disabled:opacity-50">Autoriser une fois</button>
            <button onClick={() => setDetail(detail === it.id ? null : it.id)}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:text-off">Voir le détail</button>
          </div>
        </div>
      ))}
    </section>
  );
}
