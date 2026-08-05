/**
 * Bandeau de l'app (dashboard, admin, compte). Logo PNG + nav en pastilles,
 * séparateur avant les actions, bascule FR/EN. Translucide sur le fond animé.
 */
import { LangSwitch } from "./lang-switch";
import { UI, type Lang } from "@/lib/lang";

type NavItem = { href: string; label: string; accent?: boolean };

export function AppHeader({ lang, items, right, maxWidth = "max-w-4xl" }:
  { lang: Lang; items: NavItem[]; right?: React.ReactNode; maxWidth?: string }) {
  const ui = UI[lang];
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-void/70 backdrop-blur-xl">
      <div className={`mx-auto flex ${maxWidth} items-center justify-between gap-4 px-6 py-3`}>
        <a href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/synopse-logo.png" alt="" width={28} height={28} className="h-7 w-7" />
          <span className="font-display text-[15px] font-bold tracking-tight text-off">SYNOPSE</span>
        </a>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {items.map((it) => (
            <a key={it.href} href={it.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                it.accent
                  ? "bg-[var(--orange-soft)] text-orange hover:bg-orange hover:text-white"
                  : "text-s400 hover:bg-white/5 hover:text-off"
              }`}>
              {it.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LangSwitch lang={lang} />
          <span aria-hidden className="h-5 w-px bg-line" />
          {right ?? (
            <form action="/auth/signout" method="post">
              <button className="rounded-full border border-line px-3 py-1.5 text-[13px] font-medium text-s400 transition hover:border-s400 hover:text-off">
                {ui.signout}
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
