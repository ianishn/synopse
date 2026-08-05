"use client";
/** Module 4 — Règles actives : libellé, sévérité, interrupteur, compteur de déclenchements. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UI, type Lang } from "@/lib/lang";

type Rule = { template_id: string; label: string; severity: string; enabled: boolean; triggers: number };

const SEV: Record<string, { label: string; cls: string }> = {
  block: { label: "block", cls: "text-red-400" },
  confirm: { label: "ask", cls: "text-amber-400" },
  notify: { label: "notify", cls: "text-s400" },
};

export function RulesSummary({ rules, lang }: { rules: Rule[]; lang: Lang }) {
  const ui = UI[lang];
  const router = useRouter();
  const [state, setState] = useState<Record<string, boolean>>(Object.fromEntries(rules.map((r) => [r.template_id, r.enabled])));
  const [busy, setBusy] = useState(false);

  async function toggle(id: string) {
    const next = !state[id];
    setBusy(true);
    setState((s) => ({ ...s, [id]: next }));
    const res = await fetch("/api/rules", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ template_id: id, enabled: next }) });
    setBusy(false);
    if (!res.ok) { setState((s) => ({ ...s, [id]: !next })); const d = await res.json().catch(() => ({})); alert(d.error ?? "Erreur"); return; }
    router.refresh();
  }

  const active = rules.filter((r) => state[r.template_id]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{ui.activeRules} <span className="ml-1 font-mono text-xs text-line">{active.length}</span></h2>
        <a href="/dashboard/rules" className="text-sm font-medium text-orange hover:text-orange-bright">{ui.fullLibrary}</a>
      </div>

      {active.length === 0 ? (
        <a href="/dashboard/rules" className="block rounded-xl border border-dashed border-line py-8 text-center text-sm text-muted transition hover:border-orange hover:text-off">
          {ui.noRules} <span className="font-medium text-orange">{ui.activateProfile}</span> {ui.inOneClick}
        </a>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-void">
          {active.map((r) => {
            const sev = SEV[r.severity] ?? SEV.confirm;
            return (
              <div key={r.template_id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-off">{r.label}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs">
                    <span className={sev.cls}>{ui[sev.label as "block" | "ask" | "notify"]}</span>
                    <span className="font-mono text-muted">· {r.triggers} {ui.triggers}{r.triggers > 1 ? "s" : ""}</span>
                  </p>
                </div>
                <button role="switch" aria-checked={state[r.template_id]} disabled={busy} onClick={() => toggle(r.template_id)}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition ${state[r.template_id] ? "bg-orange" : "bg-line"} disabled:opacity-50`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${state[r.template_id] ? "left-[1.125rem]" : "left-0.5"}`} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
