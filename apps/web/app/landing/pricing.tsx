"use client";
/** Grille de tarifs bilingue, bascule mensuel / annuel (2 mois offerts en annuel). */
import { useState } from "react";
import { CtaLink } from "./analytics";
import { COPY, type Lang } from "./copy";
import { GlowCard } from "@/components/ui/glow-card";

export function Pricing({ lang = "fr" }: { lang?: Lang }) {
  const t = COPY[lang].pricing;
  const [annual, setAnnual] = useState(true);

  return (
    <div>
      <div className="mt-8 flex items-center justify-center gap-3 text-sm">
        <button onClick={() => setAnnual(false)} className={annual ? "text-muted" : "font-medium text-off"}>{t.monthly}</button>
        <button onClick={() => setAnnual(!annual)} role="switch" aria-checked={annual}
          className="relative h-6 w-11 rounded-full bg-line transition">
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-orange transition-all ${annual ? "left-[1.375rem]" : "left-0.5"}`} />
        </button>
        <button onClick={() => setAnnual(true)} className={annual ? "font-medium text-off" : "text-muted"}>
          {t.annual} <span className="ml-1 rounded-full bg-[var(--orange-soft)] px-2 py-0.5 text-xs font-medium text-orange">{t.save}</span>
        </button>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {t.plans.map((p, i) => {
          const star = i === 1;
          return (
            <GlowCard key={p.name} featured={star} className={star ? "md:-translate-y-2" : ""}>
            <div className="p-7">
              {star && <p className="eyebrow mb-3">{t.recommended}</p>}
              <h3 className="text-lg font-semibold text-off">{p.name}</h3>
              <p className="mt-1 font-display text-3xl font-bold text-off">
                {annual ? p.annual : p.monthly}<span className="text-base font-normal text-muted">{t.perMonth}</span>
              </p>
              <p className="mt-1 h-4 text-xs text-orange">{annual ? p.note : ""}</p>
              <ul className="mt-5 space-y-2 text-[0.95rem] text-s300">
                {p.items.map((it) => (
                  <li key={it} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-orange" />{it}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <CtaLink place={`pricing-${p.name}`}
                  className={`block rounded-full py-2.5 text-center text-sm font-semibold transition ${star ? "bg-orange text-white hover:bg-orange-bright" : "border border-line text-off hover:border-s400"}`}>
                  {p.cta}
                </CtaLink>
              </div>
            </div>
            </GlowCard>
          );
        })}
      </div>
    </div>
  );
}
