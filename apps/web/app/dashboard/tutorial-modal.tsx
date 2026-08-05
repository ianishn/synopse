"use client";
/**
 * Tutoriel en pop-up animée (connecter + gérer un agent). Accessible : role dialog,
 * aria-modal, fermeture Échap / clic hors panneau, focus initial. Réutilisable :
 * un bouton déclencheur (ou ouvert d'emblée via `defaultOpen`, ex. page /dashboard/tuto).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { UI, type Lang } from "@/lib/lang";

type Step = { title: string; body: string; visual: () => React.ReactNode };

const stepsFor = (lang: Lang): Step[] => { const en = lang === "en"; return [
  {
    title: en ? "1 · Connect your agent" : "1 · Connecte ton agent",
    body: en ? "Generate a token from « Connect an agent », paste it on your agent, enable the plugin. Synopse links itself." : "Génère un token depuis « Connecter un agent », colle-le chez ton agent, active le plugin. Synopse se relie tout seul.",
    visual: () => (
      <div className="space-y-2">
        <code className="pop-in block rounded-lg bg-void-2 border border-line p-2 font-mono text-[0.7rem] text-orange">SYNOPSE_AGENT_TOKEN=syn_••••</code>
        <p className="pop-in flex items-center gap-2 text-sm text-mint-500" style={{ animationDelay: "0.4s" }}>
          <span className="h-2 w-2 rounded-full bg-mint-500" /> {en ? "Plugin enabled, agent connected" : "Plugin activé, agent connecté"}
        </p>
      </div>
    ),
  },
  {
    title: en ? "2 · Pick your rules" : "2 · Choisis tes règles",
    body: en ? "Plain words, no jargon. Turn on a whole profile or rule by rule: what your agent must ask you before acting." : "En français, sans jargon. Active un profil entier ou règle par règle : ce que ton agent doit te demander avant d'agir.",
    visual: () => (
      <div className="space-y-2">
        {(en ? ["Always ask me before spending", "Never send to an unknown domain"] : ["Toujours me demander avant de dépenser", "Jamais d'envoi vers un domaine inconnu"]).map((r, i) => (
          <div key={r} className="pop-in flex items-center justify-between rounded-lg border border-ink-100 p-2 text-sm" style={{ animationDelay: `${i * 0.25}s` }}>
            <span>{r}</span>
            <span className="relative h-5 w-9 rounded-full bg-mint-500"><span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" /></span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: en ? "3 · Approve from Telegram" : "3 · Valide depuis Telegram",
    body: en ? "When a sensitive action shows up, you get a clear request on your phone. One tap is enough." : "Quand une action sensible arrive, tu reçois une demande claire sur ton téléphone. Un tap suffit.",
    visual: () => (
      <div className="pop-in rounded-xl border border-mint-300 bg-mint-50 p-3 text-sm">
        <p className="font-medium">⚠️ {en ? "Sam wants to send 47 files to an unknown domain" : "Sam veut envoyer 47 fichiers vers un domaine inconnu"}</p>
        <div className="mt-2 flex gap-2">
          <span className="rounded-full bg-orange px-3 py-1 text-xs font-semibold text-white">{en ? "Refuse" : "Refuser"}</span>
          <span className="rounded-full border border-ink-200 px-3 py-1 text-xs">{en ? "Allow" : "Autoriser"}</span>
        </div>
      </div>
    ),
  },
  {
    title: en ? "4 · Manage your agents" : "4 · Gère tes agents",
    body: en ? "From the dashboard: freeze everything in one tap (kill switch), or delete an agent when you no longer want it." : "Depuis le tableau de bord : gèle tout en un tap (kill switch), ou supprime un agent quand tu n'en veux plus.",
    visual: () => (
      <div className="pop-in flex items-center justify-between rounded-xl border border-ink-100 p-3 text-sm">
        <span className="flex items-center gap-2 font-medium">Sam <span className="inline-flex items-center gap-1 text-ink-500"><span className="h-2 w-2 rounded-full bg-mint-500" />{en ? "Active" : "Actif"}</span></span>
        <span className="flex gap-2">
          <span className="rounded-full border border-ink-200 px-3 py-1 text-xs">{en ? "Freeze" : "Geler"}</span>
          <span className="rounded-full border border-ink-200 px-3 py-1 text-xs text-red-400">{en ? "Delete" : "Supprimer"}</span>
        </span>
      </div>
    ),
  },
]; };

export function TutorialModal({ defaultOpen = false, label, lang = "fr" }:
  { defaultOpen?: boolean; label?: string; lang?: Lang }) {
  const ui = UI[lang];
  const en = lang === "en";
  const STEPS = stepsFor(lang);
  const [open, setOpen] = useState(defaultOpen);
  const [i, setI] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    // Focus initial sur un vrai contrôle (bouton fermer) : anneau de focus natif, a11y correcte.
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, close]);

  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <>
      <button onClick={() => { setI(0); setOpen(true); }}
        className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium transition hover:border-mint-400">
        {label ?? ui.howItWorks}
      </button>

      {open && (
        <div className="overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={close}>
          <div role="dialog" aria-modal="true" aria-labelledby="tuto-title"
            onClick={(e) => e.stopPropagation()}
            className="modal-in w-full max-w-md rounded-3xl border border-ink-100 bg-paper p-6 shadow-[0_30px_80px_-24px_rgba(6,9,8,0.4)]">
            <div className="flex items-center justify-between">
              <p className="eyebrow">{en ? "Tutorial" : "Tutoriel"}</p>
              <button ref={closeRef} onClick={close} aria-label={en ? "Close tutorial" : "Fermer le tutoriel"}
                className="rounded-full px-2 text-ink-400 hover:text-ink-900">✕</button>
            </div>

            <h2 id="tuto-title" className="mt-3 font-display text-xl font-bold">{step.title}</h2>
            <p className="mt-2 text-sm text-ink-500">{step.body}</p>

            <div key={i} className="mt-5 min-h-[110px] rounded-2xl bg-canvas-warm p-4">{step.visual()}</div>

            {/* Progression + navigation */}
            <div className="mt-5 flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, n) => (
                  <button key={n} onClick={() => setI(n)} aria-label={`${en ? "Step" : "Étape"} ${n + 1}`}
                    className={`h-1.5 rounded-full transition-[width,background-color] ${n === i ? "w-6 bg-mint-500" : "w-2.5 bg-ink-200"}`} />
                ))}
              </div>
              <div className="flex gap-2">
                {i > 0 && (
                  <button onClick={() => setI(i - 1)} className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium transition hover:border-ink-400">
                    {en ? "Previous" : "Précédent"}
                  </button>
                )}
                {last ? (
                  <a href="/dashboard/connect" className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-bright">
                    {en ? "Connect my agent" : "Connecter mon agent"}
                  </a>
                ) : (
                  <button onClick={() => setI(i + 1)} className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-bright">
                    {en ? "Next" : "Suivant"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
