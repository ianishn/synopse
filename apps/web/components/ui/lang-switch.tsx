"use client";
/** Bascule FR/EN dans l'app (mémorisée en cookie, partagée avec la landing). */
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LangSwitch({ lang }: { lang: "fr" | "en" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const other = lang === "fr" ? "en" : "fr";

  async function swap() {
    setBusy(true);
    await fetch("/api/lang", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lang: other }) });
    setBusy(false);
    router.refresh();
  }

  return (
    <button onClick={swap} disabled={busy} aria-label="Change language"
      className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted transition hover:border-s400 hover:text-off disabled:opacity-50">
      {other.toUpperCase()}
    </button>
  );
}
