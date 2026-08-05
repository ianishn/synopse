"use client";
/** Facturation : plan courant, changement (mensuel/annuel), désabonnement, portail Stripe. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UI, type Lang } from "@/lib/lang";



export function BillingManager({ plan, renewal, cancelAtEnd, lang }:
  { plan: string; status: string; renewal: string | null; cancelAtEnd: boolean; lang: Lang }) {
  const ui = UI[lang];
  const PLAN_LABEL: Record<string, string> = { free: ui.planFree, protege: ui.planProtege, studio: ui.planStudio };
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [annual, setAnnual] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const isPaid = plan !== "free";

  async function post(path: string, body?: object) {
    setBusy(true);
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
    const data = await res.json().catch(() => ({}));
    if (data.url) { location.href = data.url; return; }
    setBusy(false);
    if (!res.ok) { alert(data.error ?? ui.genericErr); return; }
    setConfirmCancel(false);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Plan courant */}
      <div className="rounded-2xl border border-ink-100 bg-paper p-6">
        <p className="text-sm text-ink-400">{ui.currentPlan}</p>
        <p className="mt-1 font-display text-2xl font-bold text-off">{PLAN_LABEL[plan] ?? plan}</p>
        {isPaid && renewal && (
          <p className="mt-2 text-sm text-ink-500">
            {cancelAtEnd ? <>{ui.endsOn} <span className="text-off">{renewal}</span> {ui.cancelScheduled}</>
              : <>{ui.renewsOn} <span className="text-off">{renewal}</span>.</>}
          </p>
        )}
      </div>

      {/* Changer de plan (si gratuit) */}
      {!isPaid && (
        <div className="rounded-2xl border border-ink-100 bg-paper p-6">
          <h2 className="font-semibold text-off">{ui.goPaid}</h2>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <button onClick={() => setAnnual(false)} className={annual ? "text-ink-400" : "font-medium text-off"}>{ui.monthly}</button>
            <button onClick={() => setAnnual(!annual)} role="switch" aria-checked={annual} className="relative h-5 w-9 rounded-full bg-ink-200">
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-orange transition-all ${annual ? "left-[1.125rem]" : "left-0.5"}`} />
            </button>
            <button onClick={() => setAnnual(true)} className={annual ? "font-medium text-off" : "text-ink-400"}>{ui.annual} <span className="text-orange">{ui.monthsFree}</span></button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => post("/api/billing/checkout", { plan: "protege", interval: annual ? "annual" : "monthly" })}
              className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-bright disabled:opacity-50">
              {ui.planProtege}, {annual ? "99 €" : "9,99 €"}{annual ? "/an" : ui.perMonth}
            </button>
            <button disabled={busy} onClick={() => post("/api/billing/checkout", { plan: "studio", interval: annual ? "annual" : "monthly" })}
              className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium transition hover:border-ink-400 disabled:opacity-50">
              {ui.planStudio}, {annual ? "199 €" : "19,99 €"}{annual ? "/an" : ui.perMonth}
            </button>
          </div>
        </div>
      )}

      {/* Gérer / désabonner (si payant) */}
      {isPaid && (
        <>
          <div className="rounded-2xl border border-ink-100 bg-paper p-6">
            <h2 className="font-semibold text-off">{ui.manageSub}</h2>
            <p className="mt-1 text-sm text-ink-400">{ui.manageSubHint}</p>
            <button disabled={busy} onClick={() => post("/api/billing/portal")}
              className="mt-4 rounded-full border border-ink-200 px-4 py-2 text-sm font-medium transition hover:border-ink-400 disabled:opacity-50">
              {ui.openPortal}
            </button>
          </div>

          {!cancelAtEnd && (
            <div className="rounded-2xl border border-ink-100 bg-paper p-6">
              <h2 className="font-semibold text-off">{ui.unsubscribe}</h2>
              <p className="mt-1 text-sm text-ink-400">{ui.unsubHint}</p>
              {!confirmCancel ? (
                <button className="mt-4 rounded-full border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10" onClick={() => setConfirmCancel(true)}>
                  {ui.cancelSub}
                </button>
              ) : (
                <div className="mt-4 flex items-center gap-2">
                  <button disabled={busy} onClick={() => post("/api/billing/cancel")} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50">{ui.confirmCancel}</button>
                  <button onClick={() => setConfirmCancel(false)} className="rounded-full border border-ink-200 px-4 py-2 text-sm transition hover:border-ink-400">{ui.cancel}</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
