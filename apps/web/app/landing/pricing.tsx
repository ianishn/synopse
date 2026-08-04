"use client";
/** Grille de tarifs avec bascule mensuel / annuel (2 mois offerts en annuel). */
import { useState } from "react";
import { CtaLink } from "./analytics";

type Plan = {
  name: string; star: boolean;
  monthly: string; annual: string; annualNote?: string;
  items: string[];
};

const PLANS: Plan[] = [
  { name: "Gratuit", star: false, monthly: "0 €", annual: "0 €", items: ["1 agent", "3 règles", "Kill switch", "Journal 7 jours"] },
  { name: "Protégé", star: true, monthly: "9 €", annual: "7,50 €", annualNote: "90 €/an — 2 mois offerts",
    items: ["Règles illimitées", "Validation Telegram", "Plafonds de dépense", "Rapport hebdo", "Journal 90 jours"] },
  { name: "Studio", star: false, monthly: "19 €", annual: "15,83 €", annualNote: "190 €/an — 2 mois offerts",
    items: ["Tout Protégé", "5 agents", "Règles par agent", "Support prioritaire"] },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <div>
      {/* Bascule */}
      <div className="mt-8 flex items-center justify-center gap-3 text-sm">
        <button onClick={() => setAnnual(false)} className={annual ? "text-muted" : "font-medium text-off"}>Mensuel</button>
        <button onClick={() => setAnnual(!annual)} role="switch" aria-checked={annual}
          className="relative h-6 w-11 rounded-full bg-line transition">
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-orange transition-all ${annual ? "left-[1.375rem]" : "left-0.5"}`} />
        </button>
        <button onClick={() => setAnnual(true)} className={annual ? "font-medium text-off" : "text-muted"}>
          Annuel <span className="ml-1 rounded-full bg-[var(--orange-soft)] px-2 py-0.5 text-xs font-medium text-orange">−2 mois</span>
        </button>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.name}
            className={`rounded-2xl p-7 transition-transform hover:-translate-y-1 ${p.star ? "border-2 border-orange bg-surface shadow-[0_24px_60px_-20px_rgba(234,88,12,0.35)] md:-translate-y-2" : "border border-line bg-surface"}`}>
            {p.star && <p className="eyebrow mb-3">Recommandé</p>}
            <h3 className="text-lg font-semibold text-off">{p.name}</h3>
            <p className="mt-1 font-display text-3xl font-bold text-off">
              {annual ? p.annual : p.monthly}<span className="text-base font-normal text-muted">/mois</span>
            </p>
            <p className="mt-1 h-4 text-xs text-orange">{annual && p.annualNote ? p.annualNote : ""}</p>
            <ul className="mt-5 space-y-2 text-[0.95rem] text-s300">
              {p.items.map((it) => (
                <li key={it} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-orange" />{it}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <CtaLink place={`pricing-${p.name}`}
                className={`block rounded-full py-2.5 text-center text-sm font-semibold transition ${p.star ? "bg-orange text-white hover:bg-orange-bright" : "border border-line text-off hover:border-s400"}`}>
                {p.name === "Gratuit" ? "Commencer gratuitement" : "Choisir " + p.name}
              </CtaLink>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
