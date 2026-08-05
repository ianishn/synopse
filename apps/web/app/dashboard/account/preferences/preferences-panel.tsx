"use client";
/** Préférences : bascule de langue (cookie partagé landing/app) + statut du lien Telegram. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UI, type Lang } from "@/lib/lang";

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-paper p-6">
      <h2 className="font-semibold text-off">{title}</h2>
      {desc && <p className="mt-1 text-sm text-ink-400">{desc}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

const LANGS: { code: Lang; label: string }[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
];

export function PreferencesPanel({ lang, telegramLinked }: { lang: Lang; telegramLinked: boolean }) {
  const ui = UI[lang];
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setLang(code: Lang) {
    if (code === lang || busy) return;
    setBusy(true);
    await fetch("/api/lang", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lang: code }) });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Card title={ui.language} desc={ui.langHint}>
        <div className="flex gap-2">
          {LANGS.map((l) => (
            <button key={l.code} disabled={busy} onClick={() => setLang(l.code)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${lang === l.code ? "border-orange bg-[var(--orange-soft)] text-orange" : "border-ink-200 text-ink-500 hover:border-ink-400 hover:text-off"}`}>
              {l.label}
            </button>
          ))}
        </div>
      </Card>

      <Card title={ui.notifTelegram}>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 shrink-0 rounded-full ${telegramLinked ? "bg-green-500" : "bg-amber-500"}`} aria-hidden />
            <span className={telegramLinked ? "text-off" : "text-ink-400"}>{telegramLinked ? ui.tgLinked : ui.tgNotLinked}</span>
          </span>
          {!telegramLinked && (
            <a href="/dashboard/connect" className="shrink-0 rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-bright">
              {ui.tgGoLink}
            </a>
          )}
        </div>
      </Card>
    </div>
  );
}
