"use client";
/**
 * « Sans Synopse » — l'histoire en 3 étapes, lisible par un non-technicien :
 * un mail piégé arrive → l'agent obéit → les dégâts. Remplace l'ancien schéma
 * SVG technique (tokens, tool_calls, journal défilant) trop dense pour la landing.
 */
import { useEffect, useState } from "react";
import type { Lang } from "./copy";

const T: Record<Lang, {
  badge: string;
  steps: { icon: IconName; title: string; sub: string }[];
  dmg: string[];
  takeaway: string;
}> = {
  fr: {
    badge: "Sans Synopse, voilà ce qui se passe",
    steps: [
      { icon: "mail", title: "Un mail piégé arrive", sub: "« Facture en pièce jointe, merci de traiter… » Dedans, une instruction cachée que toi, tu ne vois pas." },
      { icon: "bot", title: "Ton agent obéit", sub: "Il croit bien faire. Il lit le mail, suit l'instruction cachée et prépare les actions sans se méfier." },
      { icon: "alert", title: "Les dégâts, en une seconde", sub: "Trois actions parties d'un coup :" },
    ],
    dmg: ["47 fichiers clients envoyés", "49,99 € dépensés", "Publication sur tes réseaux"],
    takeaway: "Aucune alerte. Tu le découvres demain matin.",
  },
  en: {
    badge: "Without Synopse, here is what happens",
    steps: [
      { icon: "mail", title: "A trapped email arrives", sub: "“Invoice attached, please process…” Inside, a hidden instruction you never see." },
      { icon: "bot", title: "Your agent complies", sub: "It means well. It reads the email, follows the hidden instruction and lines up the actions without a doubt." },
      { icon: "alert", title: "The damage, in one second", sub: "Three actions fired at once:" },
    ],
    dmg: ["47 client files sent out", "€49.99 spent", "Posted to your socials"],
    takeaway: "No alert. You find out tomorrow morning.",
  },
};

type IconName = "mail" | "bot" | "alert";

/** Icônes trait maison (style lucide, 24px, stroke 1.5) — jamais d'émoji dans l'UI. */
const ICON_PATHS: Record<IconName, React.ReactNode> = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7.5 9 6 9-6" />
    </>
  ),
  bot: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="2" />
      <path d="M12 9V5.5" />
      <circle cx="12" cy="4" r="1.2" />
      <path d="M9 13.5v2M15 13.5v2" />
    </>
  ),
  alert: (
    <>
      <path d="m10.29 3.86-8.2 14.2A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.73-2.94l-8.2-14.2a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
};

function StepIcon({ name, danger }: { name: IconName; danger?: boolean }) {
  return (
    <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${danger ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-orange/30 bg-[var(--orange-soft)] text-orange"}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
        {ICON_PATHS[name]}
      </svg>
    </span>
  );
}

export function AgentPipeline({ lang }: { lang: Lang }) {
  const t = T[lang];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % 3), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <p className="mb-6 flex items-center justify-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-red-400">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
        {t.badge}
      </p>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
        {t.steps.map((s, i) => (
          <div key={s.title} className="contents">
            {i > 0 && <div className="hidden items-center font-mono text-xl text-orange/60 md:flex" aria-hidden>→</div>}
            <div className={`rounded-2xl border p-6 text-left transition-colors duration-500 ${active === i ? "border-orange/60 bg-void" : "border-line bg-void/60"}`}>
              <div className="flex items-center gap-3">
                <StepIcon name={s.icon} danger={i === 2} />
                <span className="font-mono text-xs text-muted">{i + 1}/3</span>
              </div>
              <h3 className="mt-3 font-semibold text-off">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-s400">{s.sub}</p>
              {i === 2 && (
                <ul className="mt-3 space-y-2">
                  {t.dmg.map((d) => (
                    <li key={d} className="flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/5 px-3 py-1.5 text-sm text-red-300">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />{d}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-sm italic text-muted">{t.takeaway}</p>
    </div>
  );
}
