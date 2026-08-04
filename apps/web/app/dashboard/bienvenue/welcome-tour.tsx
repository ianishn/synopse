"use client";
/** Tuto auto-lancé des fonctionnalités débloquées, selon le plan (Protégé / Studio). */
import { useEffect, useRef, useState } from "react";

type Step = { icon: string; title: string; body: string; href?: string };

const PROTEGE: Step[] = [
  { icon: "📋", title: "Règles illimitées", body: "Active toute la bibliothèque et les profils métier (Perso, Commerçant, Builder) en un clic.", href: "/dashboard/rules" },
  { icon: "💶", title: "Plafonds de dépense", body: "Fixe un budget par jour et par mois. Alerte à 80 %, blocage automatique au plafond.", href: "/dashboard" },
  { icon: "📡", title: "Surveillance de bon fonctionnement", body: "Sois prévenu si un agent devient silencieux ou si une tâche attendue n'est pas partie." },
  { icon: "📊", title: "Rapport hebdo & journal 90 jours", body: "Chaque dimanche : tâches, coût, validations, blocages. Historique conservé 90 jours." },
];

const STUDIO_EXTRA: Step[] = [
  { icon: "🤖", title: "Jusqu'à 5 agents", body: "Connecte et protège jusqu'à 5 agents depuis le même tableau de bord.", href: "/dashboard/connect" },
  { icon: "🎛️", title: "Règles par agent", body: "Configure des règles différentes pour chaque agent selon son rôle." },
  { icon: "📈", title: "Comparaison des agents", body: "Compare coût, activité et interceptions de tous tes agents d'un coup d'œil." },
  { icon: "⬇️", title: "Export CSV & support prioritaire", body: "Exporte ton journal en CSV et passe en tête de file pour le support." },
];

export function WelcomeTour({ plan }: { plan: "protege" | "studio" }) {
  const steps = plan === "studio" ? [...PROTEGE, ...STUDIO_EXTRA] : PROTEGE;
  const [open, setOpen] = useState(true);
  const [i, setI] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, steps.length]);

  if (!open) {
    return <a href="/dashboard" className="mt-8 rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-bright">Aller au tableau de bord</a>;
  }

  const step = steps[i];
  const last = i === steps.length - 1;

  return (
    <div className="overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="wt-title" onClick={(e) => e.stopPropagation()}
        className="modal-in w-full max-w-md rounded-3xl border border-line bg-surface p-6 text-left shadow-[0_30px_80px_-24px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Nouvelles fonctionnalités</p>
          <button ref={closeRef} onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-full px-2 text-muted hover:text-off">✕</button>
        </div>
        <div key={i} className="pop-in mt-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--orange-soft)] text-2xl">{step.icon}</span>
          <h2 id="wt-title" className="mt-4 font-display text-xl font-bold text-off">{step.title}</h2>
          <p className="mt-2 text-sm text-s400">{step.body}</p>
          {step.href && <a href={step.href} className="mt-3 inline-block text-sm font-medium text-orange hover:text-orange-bright">Y aller →</a>}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, n) => (
              <button key={n} onClick={() => setI(n)} aria-label={`Étape ${n + 1}`}
                className={`h-1.5 rounded-full transition-[width,background-color] ${n === i ? "w-6 bg-orange" : "w-2.5 bg-line"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {i > 0 && <button onClick={() => setI(i - 1)} className="rounded-full border border-line px-4 py-2 text-sm font-medium text-off transition hover:border-s400">Précédent</button>}
            {last ? (
              <a href="/dashboard" className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-bright">C&apos;est parti</a>
            ) : (
              <button onClick={() => setI(i + 1)} className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-bright">Suivant</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
