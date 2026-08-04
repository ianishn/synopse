"use client";
/** Menu latéral du hub Compte (état actif via le chemin courant). */
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard/account", label: "Profil" },
  { href: "/dashboard/account/billing", label: "Facturation" },
  { href: "/dashboard/account/payments", label: "Paiements" },
];

export function AccountMenu() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-ink-100 bg-paper p-1.5 text-sm sm:flex-col sm:gap-0.5">
      {ITEMS.map((it) => {
        const active = path === it.href;
        return (
          <Link key={it.href} href={it.href}
            className={`rounded-xl px-4 py-2.5 font-medium transition ${active ? "bg-[var(--orange-soft)] text-orange" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"}`}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
