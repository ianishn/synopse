/**
 * Landing synopse.eu (F9) — identité héritée de l'ancien site (papier, encres, menthe),
 * enrichie : halo + grille au hero, révélations au scroll, compteurs animés, démo jouable.
 * Structure de conversion imposée par la spec, UN seul CTA (→ /login).
 */
import Link from "next/link";
import { CtaLink, LandingAnalytics } from "./landing/analytics";
import { Demo } from "./landing/demo";
import { Reveal } from "./landing/reveal";
import { Counter } from "./landing/counter";

const CTA =
  "inline-flex items-center gap-2 rounded-full bg-ink-950 px-7 py-3.5 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(6,9,8,0.4)] transition-all hover:bg-ink-700 hover:-translate-y-0.5";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <LandingAnalytics />

      {/* Header sobre */}
      <header className="sticky top-0 z-20 border-b border-ink-100/60 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <p className="font-display text-lg font-bold tracking-tight">synopse<span className="text-mint-500">.</span></p>
          <CtaLink place="header" className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium transition hover:border-ink-400">
            Se connecter
          </CtaLink>
        </div>
      </header>

      {/* 1 · Hero */}
      <section data-section="hero" className="relative overflow-hidden px-6 pb-28 pt-20">
        {/* Décor : grille + halo menthe */}
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="glow pointer-events-none absolute left-1/2 top-0 h-[420px] w-[620px] -translate-x-1/2 opacity-25" aria-hidden />

        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-paper/70 px-3 py-1 text-xs font-medium text-ink-600 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-500 pulse-ring" />
              Compatible OpenClaw · plugin open source
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] md:text-[3.4rem]">
              Ton agent IA bosse pour toi.<br />
              <span className="text-ink-400">Synopse vérifie qu&apos;il ne fait que ça.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-ink-500">
              Validation des actions sensibles sur Telegram, plafonds de dépense, bouton d&apos;arrêt d&apos;urgence.
              Protégé en 3 minutes, sans toucher un fichier.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <CtaLink place="hero" className={CTA}>Protéger mon agent — gratuit <span aria-hidden>→</span></CtaLink>
              <span className="text-sm text-ink-400">Gratuit · sans carte</span>
            </div>
          </Reveal>

          {/* Maquette d'interception (animée, léger tilt) */}
          <Reveal delay={320}>
            <div className="group mx-auto mt-16 max-w-sm [perspective:1200px]">
              <div className="rounded-2xl border border-ink-100 bg-paper p-5 text-left shadow-[0_28px_70px_-24px_rgba(6,9,8,0.3)] transition-transform duration-500 [transform:rotateX(6deg)] group-hover:[transform:rotateX(0deg)]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-mint-500 pulse-ring" />
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink-400">Telegram · Synopse</span>
                </div>
                <p className="mt-3 text-[0.95rem]">⚠️ <b>Léa</b> veut envoyer un mail à <b>client@entreprise.fr</b></p>
                <p className="mt-1 text-sm text-ink-400">« Bonjour, suite à notre échange… » — voir le détail</p>
                <div className="mt-4 flex gap-2 text-sm">
                  <span className="flex-1 rounded-full border border-ink-200 py-1.5 text-center text-ink-600">Refuser</span>
                  <span className="flex-1 rounded-full bg-mint-500 py-1.5 text-center font-semibold text-white">Autoriser une fois</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2 · La peur, légitimée */}
      <section data-section="fears" className="border-y border-ink-100 bg-canvas-warm px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="eyebrow text-center">Pourquoi un filet</p>
            <h2 className="mt-4 text-center text-3xl font-bold">Un agent a accès à tes fichiers,<br />tes mails, ta carte.</h2>
          </Reveal>

          {/* Bandeau de chiffres animés */}
          <Reveal delay={100}>
            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 text-center">
              <div className="rounded-2xl border border-ink-100 bg-paper p-6">
                <p className="font-display text-4xl font-bold text-ink-900"><Counter value={94} suffix=" %" /></p>
                <p className="mt-1 text-sm text-ink-500">des agents testés sont vulnérables à l&apos;injection de prompt (OWASP #1)</p>
              </div>
              <div className="rounded-2xl border border-ink-100 bg-paper p-6">
                <p className="font-display text-4xl font-bold text-ink-900"><Counter value={78} suffix=" %" /></p>
                <p className="mt-1 text-sm text-ink-500">des équipes IT ont déjà subi un dépassement de facture API</p>
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
                <div className="h-full rounded-2xl border border-ink-100 bg-paper p-7 transition-all hover:-translate-y-1 hover:border-mint-300 hover:shadow-[0_20px_50px_-24px_rgba(6,9,8,0.25)]">
                  <p className="font-mono text-sm text-mint-500">0{i + 1}</p>
                  <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-500">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3 · Démo interactive */}
      <section data-section="demo" className="relative overflow-hidden px-6 py-24">
        <div className="glow pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[560px] -translate-x-1/2 opacity-15" aria-hidden />
        <div className="relative mx-auto max-w-5xl">
          <Reveal>
            <p className="eyebrow text-center">Essaie toi-même</p>
            <h2 className="mt-4 text-center text-3xl font-bold">Bloque une attaque en un tap</h2>
            <p className="mb-12 mt-3 text-center text-ink-500">Le scénario se joue tout seul. À toi de trancher.</p>
          </Reveal>
          <Reveal delay={120}><Demo /></Reveal>
          <div className="mt-14 text-center"><CtaLink place="demo" className={CTA}>Protéger mon agent — gratuit</CtaLink></div>
        </div>
      </section>

      {/* 4 · Comment ça marche */}
      <section data-section="how" className="border-y border-ink-100 bg-canvas-warm px-6 py-24">
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
                <div className="relative h-full rounded-2xl bg-paper p-7 text-left shadow-[0_6px_24px_-12px_rgba(6,9,8,0.12)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(6,9,8,0.2)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-100 font-mono text-sm font-medium text-ink-900">{i + 1}</span>
                  {i < 2 && <span className="absolute right-6 top-9 hidden text-ink-200 md:block" aria-hidden>→</span>}
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-[0.95rem] text-ink-500">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5 · Preuve sociale */}
      <section data-section="proof" className="px-6 py-20 text-center">
        <Reveal>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-ink-600">
            {["Plugin open source", "Données en Europe · RGPD", "Fail-safe : jamais de « laisser passer » par défaut"].map((t) => (
              <span key={t} className="flex items-center gap-2 rounded-full border border-ink-200 bg-paper px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />{t}
              </span>
            ))}
          </div>
          <p className="mt-8 text-sm italic text-ink-400">Témoignages beta à venir — premiers testeurs en cours d&apos;onboarding.</p>
        </Reveal>
      </section>

      {/* 6 · Pricing + FAQ */}
      <section data-section="pricing" className="border-y border-ink-100 bg-canvas-warm px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="eyebrow text-center">Tarifs</p>
            <h2 className="mt-4 text-center text-3xl font-bold">Le prix d&apos;une assurance.<br />Pas d&apos;un sinistre.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { name: "Gratuit", price: "0 €", star: false, items: ["1 agent", "3 règles", "Kill switch", "Journal 7 jours"] },
              { name: "Protégé", price: "9 €", star: true, items: ["Règles illimitées", "Validation Telegram", "Plafonds de dépense", "Rapport hebdo", "Journal 90 jours"] },
              { name: "Studio", price: "19 €", star: false, items: ["Tout Protégé", "5 agents", "Règles par agent", "Support prioritaire"] },
            ].map((p, i) => (
              <Reveal key={p.name} delay={i * 90} className="h-full">
                <div className={`h-full rounded-2xl p-7 transition-transform hover:-translate-y-1 ${p.star ? "bg-ink-950 text-white shadow-[0_24px_60px_-20px_rgba(6,9,8,0.5)] md:-translate-y-2" : "border border-ink-100 bg-paper"}`}>
                  {p.star && <p className="eyebrow mb-3">Recommandé</p>}
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="mt-1 font-display text-3xl font-bold">{p.price}<span className={`text-base font-normal ${p.star ? "text-ink-300" : "text-ink-400"}`}>/mois</span></p>
                  <ul className={`mt-5 space-y-2 text-[0.95rem] ${p.star ? "text-ink-100" : "text-ink-600"}`}>
                    {p.items.map((it) => (
                      <li key={it} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-400" />{it}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

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
                <details key={q} className="group rounded-xl border border-ink-100 bg-paper px-5 py-4 transition hover:border-ink-200">
                  <summary className="cursor-pointer list-none font-medium marker:content-none">
                    <span className="mr-2 font-mono text-mint-500 group-open:hidden">+</span>
                    <span className="mr-2 hidden font-mono text-mint-500 group-open:inline">−</span>
                    {q}
                  </summary>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-500">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7 · CTA final + footer */}
      <section data-section="final" className="relative overflow-hidden px-6 py-28 text-center">
        <div className="glow pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[520px] -translate-x-1/2 -translate-y-1/2 opacity-20" aria-hidden />
        <Reveal>
          <div className="relative">
            <h2 className="text-3xl font-bold">Dors tranquille.<br /><span className="text-ink-400">Ton agent, lui, reste surveillé.</span></h2>
            <div className="mt-9"><CtaLink place="final" className={CTA}>Protéger mon agent — gratuit <span aria-hidden>→</span></CtaLink></div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-ink-100 px-6 py-10 text-center text-xs text-ink-400">
        <p className="font-display text-sm font-bold text-ink-900">synopse<span className="text-mint-500">.</span></p>
        <p className="mt-3 space-x-4">
          <Link className="hover:text-ink-600" href="/mentions-legales">Mentions légales</Link>
          <Link className="hover:text-ink-600" href="/cgv">CGV</Link>
          <Link className="hover:text-ink-600" href="/confidentialite">Confidentialité</Link>
        </p>
        <p className="mt-3">© {new Date().getFullYear()} Synopse — synopse.eu</p>
      </footer>
    </div>
  );
}
