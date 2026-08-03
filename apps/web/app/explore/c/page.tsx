/**
 * Direction C — « Produit vivant » (crédibilité / utilité quotidienne).
 * Idée : le hero montre le vrai tableau de bord (agents, journal, statut) qui « respire ».
 * Signale un produit mature qu'on utilise tous les jours — parle au persona builder.
 * Diffère sur : visuel hero (dashboard riche vs carte unique) + emphase (utilité vs incident).
 */
import { CtaLink } from "../../landing/analytics";
import { Reveal } from "../../landing/reveal";
import { ExploreBar } from "../parts";

const CTA = "inline-flex items-center gap-2 rounded-full bg-ink-950 px-7 py-3.5 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(6,9,8,0.4)] transition duration-200 hover:bg-ink-700 hover:-translate-y-0.5";

export default function DirC() {
  return (
    <div className="min-h-screen pt-10">
      <ExploreBar current="c" />
      <section className="relative overflow-hidden px-6 pb-24 pt-16">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="glow pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 opacity-20" aria-hidden />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow">Ta tour de contrôle</p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] md:text-[3.4rem]">
              Tous tes agents IA,<br /><span className="text-ink-400">sous un seul regard.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-ink-500">
              Statut en direct, coûts, validations, kill switch. Un tableau de bord que tu ouvres chaque matin avec le café.
            </p>
          </Reveal>
        </div>

        {/* Mock de dashboard vivant */}
        <Reveal delay={140}>
          <div className="relative mx-auto mt-14 max-w-3xl rounded-3xl border border-ink-100 bg-paper p-5 shadow-[0_30px_80px_-24px_rgba(6,9,8,0.3)]">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <span className="font-display font-bold">synopse<span className="text-mint-500">.</span></span>
              <span className="flex gap-3 text-xs text-ink-400"><span>Règles</span><span>Journal</span></span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { n: "Sam (self-hosted)", s: "Actif", dot: "bg-mint-500", cost: "0,42 € / 30 €" },
                { n: "Léa (institut)", s: "Actif", dot: "bg-mint-500", cost: "0,08 € / 5 €" },
              ].map((a) => (
                <div key={a.n} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 text-sm">
                  <span className="flex items-center gap-2 font-medium">{a.n} <span className="inline-flex items-center gap-1 text-ink-500"><span className={`h-2 w-2 rounded-full ${a.dot} pulse-ring`} />{a.s}</span></span>
                  <span className="text-ink-400">{a.cost} aujourd&apos;hui</span>
                </div>
              ))}
              <div className="rounded-xl bg-canvas-warm p-3 text-sm">
                <p className="font-mono text-[0.62rem] uppercase tracking-widest text-ink-400">Journal · en direct</p>
                <p className="pop-in mt-1">🛡️ Bloqué — envoi vers un domaine inconnu (backup-service-cloud.net)</p>
                <p className="pop-in mt-1 text-ink-500" style={{ animationDelay: "0.3s" }}>✅ Autorisé — publication planifiée validée par toi</p>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="relative mt-10 text-center">
          <CtaLink place="hero-c" className={CTA}>Protéger mes agents — gratuit <span aria-hidden>→</span></CtaLink>
          <p className="mt-3 text-sm text-ink-400">Gratuit · 1 agent · sans carte</p>
        </div>
      </section>
      <p className="pb-16 text-center text-sm text-ink-400">↑ Direction C : le produit lui-même comme preuve. Parle aux builders (persona Maxime).</p>
    </div>
  );
}
