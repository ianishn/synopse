/**
 * Landing synopse.eu — Charte V1.0 (Void Slate / Signal Orange / Geist), Direction A « product-led ».
 * La démo jouable est le hero. Structure de conversion imposée par la spec, CTA unique (→ /login).
 */
import Link from "next/link";
import { CtaLink, LandingAnalytics } from "./landing/analytics";
import { Demo } from "./landing/demo";
import { Reveal } from "./landing/reveal";
import { Counter } from "./landing/counter";
import { Pricing } from "./landing/pricing";
import { Logo, LogoIcon } from "./logo";

const CTA =
  "inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 font-semibold text-white shadow-[0_12px_36px_-10px_rgba(234,88,12,0.55)] transition duration-200 hover:bg-orange-bright hover:-translate-y-0.5";

export default function Landing() {
  return (
    <div className="min-h-screen bg-void text-off">
      <LandingAnalytics />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line-soft bg-void/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo pulse iconClass="h-7" />
          <CtaLink place="header" className="rounded-full border border-line px-4 py-2 text-sm font-medium text-off transition hover:border-s400">
            Se connecter
          </CtaLink>
        </div>
      </header>

      {/* 1 · Hero — démo-first (Direction A) */}
      <section data-section="hero" className="relative overflow-hidden px-6 pb-24 pt-14">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="glow pointer-events-none absolute left-1/2 top-0 h-[440px] w-[680px] -translate-x-1/2 opacity-30" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-xs font-medium text-s300 backdrop-blur">
                <span className="h-1.5 w-1.5 rotate-45 bg-orange" /> Essaie avant même de t&apos;inscrire
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-4xl font-bold leading-[1.1] md:text-[3.3rem]">
                Bloque une vraie attaque,<br />
                <span className="relative inline-block">
                  <span className="text-orange">là, maintenant.</span>
                  <svg className="underline-draw absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 240 12" fill="none" preserveAspectRatio="none" aria-hidden>
                    <path d="M3 8C40 3 120 2 237 6" stroke="var(--orange)" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-md text-lg text-s400">
                Le scénario se joue tout seul — à toi de trancher. Tu comprends Synopse en 10 secondes,
                pas en 10 paragraphes.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8"><CtaLink place="hero" className={CTA}>Protéger mon agent — gratuit <span aria-hidden>→</span></CtaLink></div>
              <p className="mt-3 text-sm text-muted">Gratuit · sans carte · protégé en 3 minutes</p>
            </Reveal>
          </div>
          <Reveal delay={200}><Demo /></Reveal>
        </div>
      </section>

      {/* 2 · La peur, légitimée */}
      <section data-section="fears" className="border-y border-line-soft bg-void-2 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="eyebrow text-center">Pourquoi un filet</p>
            <h2 className="mt-4 text-center text-3xl font-bold">Un agent a accès à tes fichiers,<br />tes mails, ta carte.</h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 text-center">
              <div className="rounded-2xl border border-line bg-surface p-6">
                <p className="font-display text-4xl font-bold text-orange"><Counter value={94} suffix=" %" /></p>
                <p className="mt-1 text-sm text-s400">des agents testés sont vulnérables à l&apos;injection de prompt (OWASP #1)</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-6">
                <p className="font-display text-4xl font-bold text-orange"><Counter value={78} suffix=" %" /></p>
                <p className="mt-1 text-sm text-s400">des équipes IT ont déjà subi un dépassement de facture API</p>
              </div>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ["L'exfiltration silencieuse", "Un mail piégé suffit : ton agent envoie tes fichiers clients à un inconnu, sans te demander."],
              ["La facture surprise", "Une boucle dans la nuit, et 300 € d'API consommés au réveil, sans plafond pour l'arrêter."],
              ["La publication non voulue", "Un tweet, un mail client, un avis publié « en ton nom » — impossible à rattraper."],
            ].map(([title, desc], i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="h-full rounded-2xl border border-line bg-surface p-7 transition duration-300 hover:-translate-y-1 hover:border-orange/50">
                  <p className="font-mono text-sm text-orange">0{i + 1}</p>
                  <h3 className="mt-3 text-lg font-semibold text-off">{title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-s400">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3 · Comment ça marche */}
      <section data-section="how" className="px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal>
            <p className="eyebrow">Installation</p>
            <h2 className="mt-4 text-3xl font-bold">Protégé en 3 minutes, promis</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["Crée ton compte", "Email ou Google. Rien à installer sur ton téléphone : Telegram suffit."],
              ["Colle une commande", "Une seule ligne à copier chez ton agent. Zéro fichier à éditer."],
              ["Choisis tes règles", "En français : « Toujours me demander avant de dépenser ». Un clic par profil."],
            ].map(([title, desc], i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="relative h-full rounded-2xl border border-line bg-surface p-7 text-left transition duration-300 hover:-translate-y-1 hover:border-orange/50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--orange-soft)] font-mono text-sm font-medium text-orange">{i + 1}</span>
                  <h3 className="mt-4 font-semibold text-off">{title}</h3>
                  <p className="mt-2 text-[0.95rem] text-s400">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4 · Preuve sociale */}
      <section data-section="proof" className="border-y border-line-soft bg-void-2 px-6 py-20 text-center">
        <Reveal>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-s300">
            {["Plugin open source", "Données en Europe · RGPD", "Fail-safe : jamais de « laisser passer » par défaut"].map((t) => (
              <span key={t} className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5">
                <span className="h-1.5 w-1.5 rotate-45 bg-orange" />{t}
              </span>
            ))}
          </div>
          <p className="mt-8 text-sm italic text-muted">Témoignages beta à venir — premiers testeurs en cours d&apos;onboarding.</p>
        </Reveal>
      </section>

      {/* 5 · Pricing + FAQ */}
      <section data-section="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="eyebrow text-center">Tarifs</p>
            <h2 className="mt-4 text-center text-3xl font-bold">Le prix d&apos;une assurance.<br />Pas d&apos;un sinistre.</h2>
          </Reveal>
          <Reveal delay={100}><Pricing /></Reveal>

          <div className="mx-auto mt-16 max-w-2xl">
            <Reveal><p className="eyebrow text-center">Questions directes</p></Reveal>
            <div className="mt-6 space-y-3">
              {[
                ["Et si Synopse tombe en panne ?", "Le plugin est fail-safe : sans connexion, tes règles critiques bloquent par défaut. Un garde-fou qui plante ne laisse jamais la porte ouverte."],
                ["Vous lisez mes données ?", "Non. Les règles sont évaluées localement, chez ton agent. Seules les actions sensibles remontent, chiffrées, et sont effacées sous 90 jours. Données hébergées en Europe."],
                ["Ça marche avec quel agent ?", "OpenClaw aujourd'hui (self-hosted ou hébergé). D'autres frameworks arrivent — le besoin de contrôle survivra aux frameworks."],
                ["Je ne suis pas technicien·ne, c'est pour moi ?", "C'est exactement pour toi : une commande à coller, des règles en français, des validations lisibles sur Telegram."],
                ["Vous garantissez le 100 % sûr ?", "Non, et méfie-toi de qui le promet. Synopse est un filet de sécurité : il réduit drastiquement le risque et te rend le contrôle final."],
              ].map(([q, a]) => (
                <details key={q} className="group rounded-xl border border-line bg-surface px-5 py-4 transition hover:border-s400">
                  <summary className="cursor-pointer list-none font-medium text-off marker:content-none">
                    <span className="mr-2 font-mono text-orange group-open:hidden">+</span>
                    <span className="mr-2 hidden font-mono text-orange group-open:inline">−</span>
                    {q}
                  </summary>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-s400">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6 · CTA final */}
      <section data-section="final" className="relative overflow-hidden px-6 py-28 text-center">
        <div className="glow pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-30" aria-hidden />
        <Reveal>
          <div className="relative">
            <LogoIcon className="mx-auto h-10" pulse />
            <h2 className="mt-6 text-3xl font-bold">Dors tranquille.<br /><span className="text-s400">Ton agent, lui, reste surveillé.</span></h2>
            <div className="mt-9"><CtaLink place="final" className={CTA}>Protéger mon agent — gratuit <span aria-hidden>→</span></CtaLink></div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line px-6 py-10 text-center text-xs text-muted">
        <Logo className="justify-center" iconClass="h-6" />
        <p className="mt-3 space-x-4">
          <Link className="hover:text-s300" href="/mentions-legales">Mentions légales</Link>
          <Link className="hover:text-s300" href="/cgv">CGV</Link>
          <Link className="hover:text-s300" href="/confidentialite">Confidentialité</Link>
        </p>
        <p className="mt-3">© {new Date().getFullYear()} Synopse — synopse.eu</p>
      </footer>
    </div>
  );
}
