/**
 * Chaînes d'événements : comment une action anodine dérape jusqu'au dégât.
 * Remplace la grille de tuiles (trop générique) par une lecture séquentielle.
 */
import type { Lang } from "./copy";

type Chain = { steps: string[]; outcome: string };

const CHAINS: Record<Lang, Chain[]> = {
  fr: [
    { steps: ["Un mail arrive", "L'agent le lit", "Instruction cachée dedans", "Il envoie tes fichiers clients"], outcome: "Exfiltration silencieuse" },
    { steps: ["Tâche lancée le soir", "L'agent boucle sur une erreur", "Il relance encore et encore", "300 € d'API brûlés"], outcome: "Facture surprise au réveil" },
    { steps: ["Brouillon généré", "Aucune relecture demandée", "Publication automatique", "Message public en ton nom"], outcome: "Publication non voulue" },
  ],
  en: [
    { steps: ["An email arrives", "The agent reads it", "Hidden instruction inside", "It ships your client files"], outcome: "Silent exfiltration" },
    { steps: ["Task starts at night", "The agent loops on an error", "It retries again and again", "300 € of API burned"], outcome: "Surprise bill by morning" },
    { steps: ["Draft generated", "No review requested", "Auto-publish fires", "Public post in your name"], outcome: "Unwanted post" },
  ],
};

export function AttackChains({ lang }: { lang: Lang }) {
  return (
    <div className="mt-12 space-y-px overflow-hidden rounded-2xl border border-line">
      {CHAINS[lang].map((chain, i) => (
        <div key={chain.outcome} className="bg-void/80 px-5 py-6 backdrop-blur-xl md:px-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <span className="shrink-0 font-mono text-xs text-muted">0{i + 1}</span>
            <ol className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-2 text-sm">
              {chain.steps.map((s, j) => (
                <li key={s} className="flex items-center gap-2">
                  <span className={j === chain.steps.length - 1 ? "text-orange" : "text-s400"}>{s}</span>
                  {j < chain.steps.length - 1 && <span aria-hidden className="text-line">→</span>}
                </li>
              ))}
            </ol>
            <span className="shrink-0 self-start rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 md:self-auto">
              {chain.outcome}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
