/**
 * Landing synopse.eu (F9) — structure de conversion imposée par la spec :
 * hero → peurs → démo interactive → comment ça marche → preuve → pricing/FAQ → CTA final.
 * UN seul CTA (→ /login), zéro lien sortant dans le flux, analytics par section.
 */
import Link from "next/link";
import { CtaLink, LandingAnalytics } from "./landing/analytics";
import { Demo } from "./landing/demo";

const CTA_STYLE =
  "inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-black transition hover:bg-emerald-400";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <LandingAnalytics />

      {/* 1 · Hero */}
      <section data-section="hero" className="mx-auto max-w-4xl px-6 pb-20 pt-24 text-center">
        <p className="mb-4 text-sm tracking-wide text-emerald-400">SYNOPSE · le filet de sécurité des agents IA</p>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          Ton agent IA bosse pour toi.<br />Synopse vérifie qu&apos;il ne fait <em>que</em> ça.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg opacity-80">
          Validation des actions sensibles sur Telegram, plafonds de dépense, bouton d&apos;arrêt d&apos;urgence.
          Protection en 3 minutes, sans toucher un fichier.
        </p>
        <div className="mt-8"><CtaLink place="hero" className={CTA_STYLE}>Protéger mon agent — gratuit</CtaLink></div>

        {/* Maquette d'interception (le visuel imposé par la spec) */}
        <div className="mx-auto mt-12 max-w-md rounded-xl border border-white/15 bg-black/50 p-4 text-left font-mono text-sm">
          <p className="text-xs opacity-60">Telegram · Synopse</p>
          <p className="mt-2">⚠️ <b>Léa</b> veut envoyer un mail à <b>client@entreprise.fr</b></p>
          <p className="mt-1 text-xs opacity-60">« Bonjour, suite à notre échange… » — voir le détail</p>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="rounded border border-white/25 px-3 py-1">❌ Refuser</span>
            <span className="rounded bg-emerald-500 px-3 py-1 font-semibold text-black">✅ Autoriser une fois</span>
          </div>
        </div>
      </section>

      {/* 2 · La peur, légitimée */}
      <section data-section="fears" className="border-t border-white/10 bg-black/20 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold">Un agent a accès à tes fichiers, tes mails, ta carte.</h2>
          <p className="mt-3 text-center opacity-70">
            94 % des agents IA testés sont vulnérables à l&apos;injection de prompt (risque n°1 OWASP).
            Voilà ce qui arrive sans filet :
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ["📤", "L'exfiltration silencieuse", "Un mail piégé suffit : ton agent envoie tes fichiers clients à un inconnu, sans te demander."],
              ["💸", "La facture surprise", "Une boucle dans la nuit, et 300 € d'API consommés au réveil. 78 % des équipes IT ont déjà vécu un dépassement."],
              ["📢", "La publication non voulue", "Un tweet, un mail client, un avis publié « en ton nom » — impossible à rattraper."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <p className="text-3xl">{icon}</p>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm opacity-75">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 · Démo interactive */}
      <section data-section="demo" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold">Regarde une attaque se faire bloquer</h2>
          <p className="mb-10 mt-3 text-center opacity-70">Scénario réel, scroll pour dérouler.</p>
          <Demo />
          <div className="mt-10 text-center"><CtaLink place="demo" className={CTA_STYLE}>Protéger mon agent — gratuit</CtaLink></div>
        </div>
      </section>

      {/* 4 · Comment ça marche */}
      <section data-section="how" className="border-t border-white/10 bg-black/20 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold">Protégé en 3 minutes, promis</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ["1", "Crée ton compte", "Email ou Google. Rien à installer sur ton téléphone : Telegram suffit."],
              ["2", "Colle une commande", "Une seule ligne à copier chez ton agent. Zéro fichier à éditer."],
              ["3", "Choisis tes règles", "En français : « Toujours me demander avant de dépenser ». Un clic par profil."],
            ].map(([n, title, desc]) => (
              <div key={n} className="rounded-xl border border-white/10 p-6">
                <p className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 font-bold text-black">{n}</p>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm opacity-75">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 · Preuve sociale */}
      <section data-section="proof" className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="rounded-full border border-white/20 px-4 py-1">🔓 Plugin open source</span>
            <span className="rounded-full border border-white/20 px-4 py-1">🇪🇺 Données en Europe · RGPD</span>
            <span className="rounded-full border border-white/20 px-4 py-1">🛡️ Fail-safe : jamais de « laisser passer » par défaut</span>
          </div>
          <p className="mt-8 text-sm italic opacity-60">
            Témoignages beta à venir — les premiers testeurs sont en cours d&apos;onboarding.
          </p>
        </div>
      </section>

      {/* 6 · Pricing + FAQ */}
      <section data-section="pricing" className="border-t border-white/10 bg-black/20 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold">Le prix d&apos;une assurance. Pas d&apos;un sinistre.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { name: "Gratuit", price: "0 €", star: false, items: ["1 agent", "3 règles", "Kill switch", "Journal 7 jours"] },
              { name: "Protégé", price: "9 €/mois", star: true, items: ["Règles illimitées", "Validation Telegram", "Plafonds de dépense", "Rapport hebdo", "Journal 90 jours"] },
              { name: "Studio", price: "19 €/mois", star: false, items: ["Tout Protégé", "5 agents", "Règles par agent", "Support prioritaire"] },
            ].map((p) => (
              <div key={p.name} className={`rounded-xl border p-6 ${p.star ? "border-emerald-500 bg-emerald-500/10" : "border-white/10"}`}>
                {p.star && <p className="mb-2 text-xs font-semibold text-emerald-400">RECOMMANDÉ</p>}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="mt-1 text-2xl">{p.price}</p>
                <ul className="mt-4 space-y-1 text-sm opacity-80">
                  {p.items.map((i) => <li key={i}>✓ {i}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-2xl space-y-3">
            {[
              ["Et si Synopse tombe en panne ?", "Le plugin est fail-safe : sans connexion, tes règles critiques bloquent par défaut. Un garde-fou qui plante ne laisse jamais la porte ouverte."],
              ["Vous lisez mes données ?", "Non. Les règles sont évaluées localement, chez ton agent. Seules les actions sensibles remontent, chiffrées, et sont effacées sous 90 jours. Données hébergées en Europe."],
              ["Ça marche avec quel agent ?", "OpenClaw aujourd'hui (self-hosted ou hébergé). D'autres frameworks arrivent — le besoin de contrôle survivra aux frameworks."],
              ["Je ne suis pas technicien·ne, c'est pour moi ?", "C'est exactement pour toi : une commande à coller, des règles en français, des demandes de validation lisibles sur Telegram."],
              ["Synopse peut-il garantir le 100 % sûr ?", "Non, et méfie-toi de qui le promet. Synopse est un filet de sécurité : il réduit drastiquement le risque et te rend le contrôle final."],
            ].map(([q, a]) => (
              <details key={q} className="rounded-lg border border-white/10 p-4">
                <summary className="cursor-pointer font-medium">{q}</summary>
                <p className="mt-2 text-sm opacity-80">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 7 · CTA final + footer */}
      <section data-section="final" className="px-6 py-24 text-center">
        <h2 className="text-3xl font-bold">Dors tranquille. Ton agent, lui, reste surveillé.</h2>
        <div className="mt-8"><CtaLink place="final" className={CTA_STYLE}>Protéger mon agent — gratuit</CtaLink></div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs opacity-60">
        <p>© {new Date().getFullYear()} Synopse — synopse.eu</p>
        <p className="mt-2 space-x-4">
          <Link className="underline" href="/mentions-legales">Mentions légales</Link>
          <Link className="underline" href="/cgv">CGV</Link>
          <Link className="underline" href="/confidentialite">Confidentialité</Link>
        </p>
      </footer>
    </div>
  );
}
