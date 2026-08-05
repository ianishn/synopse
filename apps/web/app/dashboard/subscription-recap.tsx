"use client";
/** Module 8 — Compte & abonnement : plan courant, échéance, portail, récap des offres (mensuel/annuel). */
import { useState } from "react";
import { UI, type Lang } from "@/lib/lang";

type PlanKey = "free" | "protege" | "studio";

const PLANS_FR: { key: PlanKey; name: string; monthly: string; annual: string; star?: boolean; gains: string[] }[] = [
  { key: "free", name: "Gratuit", monthly: "0 €", annual: "0 €", gains: [
    "1 agent protégé", "3 règles actives", "Validation des actions via Telegram", "Kill switch", "Journal 7 jours", "Support communautaire",
  ] },
  { key: "protege", name: "Protégé", monthly: "9 €", annual: "7,50 €", star: true, gains: [
    "Règles illimitées (bibliothèque + profils métier)", "Plafonds de dépense, alerte à 80 % et blocage auto",
    "Surveillance de bon fonctionnement (agent silencieux, tâche manquée)", "Rapport hebdomadaire", "Journal 90 jours", "Support email sous 48 h",
  ] },
  { key: "studio", name: "Studio", monthly: "19 €", annual: "15,83 €", gains: [
    "Jusqu'à 5 agents", "Règles configurables agent par agent", "Comparaison des agents (coût, activité, interceptions)", "Export du journal en CSV", "Support prioritaire",
  ] },
];

const PLANS_EN: typeof PLANS_FR = [
  { key: "free", name: "Free", monthly: "0 €", annual: "0 €", gains: [
    "1 protected agent", "3 active rules", "Action approval via Telegram", "Kill switch", "7-day log", "Community support",
  ] },
  { key: "protege", name: "Protected", monthly: "9 €", annual: "7.50 €", star: true, gains: [
    "Unlimited rules (library + job profiles)", "Spending caps, alert at 80% and auto-block",
    "Health monitoring (silent agent, missed task)", "Weekly report", "90-day log", "Email support within 48 h",
  ] },
  { key: "studio", name: "Studio", monthly: "19 €", annual: "15.83 €", gains: [
    "Up to 5 agents", "Per-agent rule configuration", "Agent comparison (cost, activity, interceptions)", "CSV log export", "Priority support",
  ] },
];

const RANK: Record<PlanKey, number> = { free: 0, protege: 1, studio: 2 };

export function SubscriptionRecap({ plan, renewal, lang }: { plan: PlanKey; renewal: string | null; lang: Lang }) {
  const ui = UI[lang];
  const PLANS = lang === "en" ? PLANS_EN : PLANS_FR;
  const [annual, setAnnual] = useState(true);
  const [busy, setBusy] = useState(false);

  async function go(path: string, body?: object) {
    setBusy(true);
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
    const data = await res.json().catch(() => ({}));
    if (data.url) { location.href = data.url; return; }
    setBusy(false);
    if (!res.ok) alert(data.error ?? "Erreur");
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{ui.subscription}</h2>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-void px-5 py-4">
        <div>
          <p className="text-sm text-muted">{ui.currentPlan}</p>
          <p className="font-display text-xl font-bold text-off">{PLANS.find((p) => p.key === plan)?.name}</p>
          {plan !== "free" && renewal && <p className="mt-0.5 text-xs text-muted">{ui.nextDue} : <span className="font-mono text-s400">{renewal}</span></p>}
        </div>
        <div className="flex items-center gap-3">
          {plan !== "free" && (
            <button disabled={busy} onClick={() => go("/api/billing/portal")} className="rounded-full border border-line px-4 py-2 text-sm font-medium text-off transition hover:border-s400 disabled:opacity-50">{ui.stripePortal}</button>
          )}
          <a href="/dashboard/account/billing" className="text-sm font-medium text-orange hover:text-orange-bright">{ui.manage}</a>
        </div>
      </div>

      {/* Bascule */}
      <div className="flex items-center justify-center gap-2 pt-1 text-xs">
        <button onClick={() => setAnnual(false)} className={annual ? "text-muted" : "font-medium text-off"}>{ui.monthly}</button>
        <button onClick={() => setAnnual(!annual)} role="switch" aria-checked={annual} className="relative h-5 w-9 rounded-full bg-line">
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-orange transition-all ${annual ? "left-[1.125rem]" : "left-0.5"}`} />
        </button>
        <button onClick={() => setAnnual(true)} className={annual ? "font-medium text-off" : "text-muted"}>{ui.annual} <span className="text-orange">{ui.monthsFree}</span></button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => {
          const current = p.key === plan;
          const upgrade = RANK[p.key] > RANK[plan];
          return (
            <div key={p.key} className={`rounded-xl border p-5 ${p.star ? "border-orange" : "border-line"} ${current ? "bg-[var(--orange-soft)]" : "bg-void"}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-off">{p.name}</h3>
                {p.star && !current && <span className="rounded-full bg-[var(--orange-soft)] px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-orange">{ui.recommended}</span>}
                {current && <span className="rounded-full border border-orange px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-orange">{ui.yourPlan}</span>}
              </div>
              <p className="mt-1 font-display text-2xl font-bold text-off">{annual ? p.annual : p.monthly}<span className="text-sm font-normal text-muted">{ui.perMonth}</span></p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {p.gains.map((g) => (
                  <li key={g} className={`flex items-start gap-2 ${upgrade ? "text-s400" : "text-s400"}`}>
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-orange" />{g}
                  </li>
                ))}
              </ul>
              {upgrade && (
                <button disabled={busy} onClick={() => go("/api/billing/checkout", { plan: p.key, interval: annual ? "annual" : "monthly" })}
                  className={`mt-5 w-full rounded-full py-2 text-sm font-semibold transition ${p.star ? "bg-orange text-white hover:bg-orange-bright" : "border border-line text-off hover:border-s400"}`}>
                  {ui.switchTo} {p.name}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
