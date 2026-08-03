/**
 * Direction A — « Preuve immédiate » (product-led).
 * Idée : la démo jouable EST le hero. Le visiteur ressent le produit en 5 s avant de lire.
 * Diffère sur : hiérarchie (démo-first vs copy-first) + pattern d'interaction (jeu immédiat).
 */
import { Demo } from "../../landing/demo";
import { CtaLink } from "../../landing/analytics";
import { Reveal } from "../../landing/reveal";
import { ExploreBar } from "../parts";

const CTA = "inline-flex items-center gap-2 rounded-full bg-ink-950 px-7 py-3.5 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(6,9,8,0.4)] transition duration-200 hover:bg-ink-700 hover:-translate-y-0.5";

export default function DirA() {
  return (
    <div className="min-h-screen pt-10">
      <ExploreBar current="a" />
      <section className="relative overflow-hidden px-6 pb-20 pt-16">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="glow pointer-events-none absolute left-1/2 top-0 h-[420px] w-[620px] -translate-x-1/2 opacity-25" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal>
              <p className="eyebrow">Essaie avant de t&apos;inscrire</p>
              <h1 className="mt-5 text-4xl font-bold leading-[1.1] md:text-5xl">
                Bloque une vraie attaque,<br />là, maintenant. <span className="text-ink-400">Sans compte.</span>
              </h1>
              <p className="mt-5 max-w-md text-lg text-ink-500">
                Le scénario se joue tout seul. À toi de trancher — tu comprends Synopse en 10 secondes, pas en 10 paragraphes.
              </p>
              <div className="mt-8"><CtaLink place="hero-a" className={CTA}>Protéger mon agent — gratuit <span aria-hidden>→</span></CtaLink></div>
              <p className="mt-3 text-sm text-ink-400">Gratuit · sans carte · protégé en 3 minutes</p>
            </Reveal>
          </div>
          <Reveal delay={150}><Demo /></Reveal>
        </div>
      </section>
      <p className="pb-16 text-center text-sm text-ink-400">↑ Direction A : on montre au lieu de raconter. Le reste de la page suivrait (peurs, étapes, pricing).</p>
    </div>
  );
}
