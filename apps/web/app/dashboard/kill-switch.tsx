"use client";
/** Module 6 — Kill switch. Confirmation explicite obligatoire. Bandeau permanent une fois gelé. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UI, type Lang } from "@/lib/lang";

async function setFrozen(frozen: boolean) {
  await fetch("/api/agents/freeze-all", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ frozen }) });
}

/** Bandeau criant, affiché en haut du dashboard tant qu'au moins un agent est gelé. */
export function FrozenBanner({ lang }: { lang: Lang }) {
  const ui = UI[lang];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <div className="alert-pulse sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-red-500 bg-red-500/15 px-6 py-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-red-300">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> {ui.frozenBanner}
      </p>
      <button disabled={busy} onClick={async () => { setBusy(true); await setFrozen(false); router.refresh(); }}
        className="rounded-full border border-red-500/60 px-4 py-1.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50">
        {ui.unfreezeAgents}
      </button>
    </div>
  );
}

/** Carte module 6 sur le dashboard. */
export function KillSwitch({ frozen, lang }: { frozen: boolean; lang: Lang }) {
  const ui = UI[lang];
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function act(f: boolean) {
    setBusy(true);
    await setFrozen(f);
    setBusy(false); setConfirm(false);
    router.refresh();
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{ui.killSwitch}</h2>
      <div className={`rounded-xl border p-5 ${frozen ? "border-red-500/60 bg-red-500/5" : "border-line bg-void"}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-off">{frozen ? ui.agentsFrozen : ui.allFine}</p>
            <p className="mt-1 text-sm text-muted">{ui.killDesc}</p>
          </div>
          {frozen ? (
            <button disabled={busy} onClick={() => act(false)}
              className="shrink-0 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-off transition hover:border-s400 disabled:opacity-50">{ui.unfreeze}</button>
          ) : !confirm ? (
            <button onClick={() => setConfirm(true)}
              className="shrink-0 rounded-full border border-red-500/50 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10">{ui.freezeAll}</button>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <button disabled={busy} onClick={() => act(true)}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50">{ui.confirmFreeze}</button>
              <button onClick={() => setConfirm(false)} className="rounded-full border border-line px-4 py-2.5 text-sm transition hover:border-s400">{ui.cancel}</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
