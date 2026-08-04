/**
 * Landing partagée FR/EN (charte V1.0, Direction A démo-first).
 * Rendue par app/page.tsx (fr) et app/en/page.tsx (en). Textes via COPY[lang].
 */
import Link from "next/link";
import { CtaLink, LandingAnalytics } from "./analytics";
import { Demo } from "./demo";
import { Reveal } from "./reveal";
import { Counter } from "./counter";
import { Pricing } from "./pricing";
import { COPY, type Lang } from "./copy";
import { AuroraBackground } from "./aurora-bg";
import { Logo, LogoIcon } from "../logo";

const CTA =
  "inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 font-semibold text-white shadow-[0_12px_36px_-10px_rgba(234,88,12,0.55)] transition duration-200 hover:bg-orange-bright hover:-translate-y-0.5";

export function Landing({ lang }: { lang: Lang }) {
  const t = COPY[lang];

  return (
    <div className="relative min-h-screen text-off">
      <AuroraBackground className="fixed inset-0 -z-10" />
      <LandingAnalytics />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line-soft bg-void/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Link href={t.nav.otherHref} className="rounded-full border border-line px-3 py-2 text-sm font-medium text-s300 transition hover:border-s400" aria-label="Change language">
              {t.nav.other}
            </Link>
            <CtaLink place="header" className="rounded-full border border-line px-4 py-2 text-sm font-medium text-off transition hover:border-s400">
              {t.nav.signin}
            </CtaLink>
          </div>
        </div>
      </header>

      {/* 1 · Hero, démo-first, fond shader WebGL animé (voir ShaderBackground) */}
      <section data-section="hero" className="relative overflow-hidden px-6 pb-24 pt-14">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-void" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-xs font-medium text-s300 backdrop-blur">
                <span className="h-1.5 w-1.5 rotate-45 bg-orange" /> {t.hero.badge}
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-4xl font-bold leading-[1.1] md:text-[3.3rem]">
                {t.hero.title1}<br />
                <span className="text-orange">{t.hero.title2}</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-md text-lg text-s400">{t.hero.sub}</p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8"><CtaLink place="hero" className={CTA}>{t.hero.cta} <span aria-hidden>→</span></CtaLink></div>
              <p className="mt-3 text-sm text-muted">{t.hero.trust}</p>
            </Reveal>
          </div>
          <Reveal delay={200}><Demo lang={lang} /></Reveal>
        </div>
      </section>

      {/* 2 · La peur, légitimée */}
      <section data-section="fears" className="border-y border-line-soft bg-void-2 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="eyebrow text-center">{t.fears.eyebrow}</p>
            <h2 className="mt-4 text-center text-3xl font-bold">{t.fears.title[0]}<br />{t.fears.title[1]}</h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 text-center">
              <div className="rounded-2xl border border-line bg-surface p-6">
                <p className="font-display text-4xl font-bold text-orange"><Counter value={94} suffix=" %" /></p>
                <p className="mt-1 text-sm text-s400">{t.fears.stat1}</p>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-6">
                <p className="font-display text-4xl font-bold text-orange"><Counter value={78} suffix=" %" /></p>
                <p className="mt-1 text-sm text-s400">{t.fears.stat2}</p>
              </div>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {t.fears.cards.map(([title, desc], i) => (
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
            <p className="eyebrow">{t.how.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-bold">{t.how.title}</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {t.how.steps.map(([title, desc], i) => (
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
            {t.proof.badges.map((b) => (
              <span key={b} className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5">
                <span className="h-1.5 w-1.5 rotate-45 bg-orange" />{b}
              </span>
            ))}
          </div>
          <p className="mt-8 text-sm italic text-muted">{t.proof.note}</p>
        </Reveal>
      </section>

      {/* 5 · Pricing + FAQ */}
      <section data-section="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="eyebrow text-center">{t.pricing.eyebrow}</p>
            <h2 className="mt-4 text-center text-3xl font-bold">{t.pricing.title[0]}<br />{t.pricing.title[1]}</h2>
          </Reveal>
          <Reveal delay={100}><Pricing lang={lang} /></Reveal>

          <div className="mx-auto mt-16 max-w-2xl">
            <Reveal><p className="eyebrow text-center">{t.pricing.faqTitle}</p></Reveal>
            <div className="mt-6 space-y-3">
              {t.pricing.faq.map(([q, a]) => (
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
            <LogoIcon className="mx-auto" size={48} />
            <h2 className="mt-6 text-3xl font-bold">{t.final.title[0]}<br /><span className="text-s400">{t.final.title[1]}</span></h2>
            <div className="mt-9"><CtaLink place="final" className={CTA}>{t.final.cta} <span aria-hidden>→</span></CtaLink></div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line px-6 py-10 text-center text-xs text-muted">
        <Logo className="justify-center" />
        <p className="mt-3 space-x-4">
          <Link className="hover:text-s300" href="/mentions-legales">{t.footer.legal}</Link>
          <Link className="hover:text-s300" href="/cgv">{t.footer.cgv}</Link>
          <Link className="hover:text-s300" href="/confidentialite">{t.footer.privacy}</Link>
        </p>
        <p className="mt-3">© {new Date().getFullYear()} Synopse · synopse.eu</p>
      </footer>
    </div>
  );
}
