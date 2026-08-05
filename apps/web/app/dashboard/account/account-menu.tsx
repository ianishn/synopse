"use client";
/**
 * Menu latéral du hub Compte : bloc identité (nom, email, plan), sections
 * groupées avec icônes trait (jamais d'émoji), déconnexion en bas.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UI, type Lang } from "@/lib/lang";

type IconName = "user" | "sliders" | "card" | "receipt" | "logout";

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  user: (<><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>),
  sliders: (<><path d="M4 8h9M17 8h3M4 16h3M11 16h9" /><circle cx="15" cy="8" r="2" /><circle cx="9" cy="16" r="2" /></>),
  card: (<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10.5h18" /></>),
  receipt: (<><path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21Z" /><path d="M9.5 8.5h5M9.5 12.5h5" /></>),
  logout: (<><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /><path d="m15 8 4 4-4 4M19 12H9" /></>),
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden>
      {ICON_PATHS[name]}
    </svg>
  );
}

export function AccountMenu({ lang, name, email, planLabel }: { lang: Lang; name: string; email: string; planLabel: string }) {
  const ui = UI[lang];
  const path = usePathname();

  const GROUPS: { label: string; items: { href: string; label: string; icon: IconName }[] }[] = [
    {
      label: ui.grpAccount,
      items: [
        { href: "/dashboard/account", label: ui.tabProfile, icon: "user" },
        { href: "/dashboard/account/preferences", label: ui.tabPreferences, icon: "sliders" },
      ],
    },
    {
      label: ui.grpBilling,
      items: [
        { href: "/dashboard/account/billing", label: ui.tabBilling, icon: "card" },
        { href: "/dashboard/account/payments", label: ui.tabPayments, icon: "receipt" },
      ],
    },
  ];

  return (
    <nav className="flex h-fit flex-col rounded-2xl border border-ink-100 bg-paper p-2">
      {/* Identité */}
      <div className="flex items-center gap-3 rounded-xl px-3 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--orange-soft)] font-semibold text-orange">
          {(name || email).charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-off">{name || email}</p>
          <p className="truncate text-xs text-ink-400">{email}</p>
        </div>
        <span className="ml-auto shrink-0 rounded-full border border-orange/40 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide text-orange">{planLabel}</span>
      </div>

      {GROUPS.map((g) => (
        <div key={g.label} className="mt-1">
          <p className="px-3 pb-1 pt-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-400">{g.label}</p>
          {g.items.map((it) => {
            const active = path === it.href;
            return (
              <Link key={it.href} href={it.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? "bg-[var(--orange-soft)] text-orange" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"}`}>
                <Icon name={it.icon} />{it.label}
              </Link>
            );
          })}
        </div>
      ))}

      <form action="/auth/signout" method="post" className="mt-2 border-t border-ink-100 pt-2">
        <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink-500 transition hover:bg-red-500/10 hover:text-red-400">
          <Icon name="logout" />{ui.signout}
        </button>
      </form>
    </nav>
  );
}
