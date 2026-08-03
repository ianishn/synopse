"use client";
/** Bandeau d'exploration : identifie la direction et permet de comparer. (Pages /explore/* — temporaires.) */
import Link from "next/link";

export function ExploreBar({ current }: { current: "a" | "b" | "c" }) {
  const opts: { k: "a" | "b" | "c"; label: string }[] = [
    { k: "a", label: "A · Preuve immédiate" },
    { k: "b", label: "B · Peur → Soulagement" },
    { k: "c", label: "C · Produit vivant" },
  ];
  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-ink-950/90 px-4 py-2 text-xs text-white backdrop-blur">
      <span className="mr-2 font-mono uppercase tracking-widest text-mint-300">Exploration</span>
      {opts.map((o) => (
        <Link key={o.k} href={`/explore/${o.k}`}
          className={`rounded-full px-3 py-1 transition ${current === o.k ? "bg-mint-500 font-semibold text-white" : "border border-white/25 hover:border-white/50"}`}>
          {o.label}
        </Link>
      ))}
    </div>
  );
}
