"use client";
/** Catalogue de règles groupé par profil, toggles + activation de profil. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UI, type Lang } from "@/lib/lang";

type Tpl = { id: string; label: string; description: string; severity: string; profiles: string[] };

const PROFILES: { key: string; label: string; hint: string }[] = [
  { key: "perso", label: "profPerso", hint: "profPersoHint" },
  { key: "commercant", label: "profShop", hint: "profShopHint" },
  { key: "builder", label: "profBuilder", hint: "profBuilderHint" },
];

const SEVERITY: Record<string, { label: string; cls: string }> = {
  block: { label: "block", cls: "bg-red-500/10 text-red-300" },
  confirm: { label: "ask", cls: "bg-mint-50 text-mint-500" },
  notify: { label: "notify", cls: "bg-amber-500/10 text-amber-300" },
};

export function RulesManager({ catalog, enabledIds, limit, plan, lang }:
  { catalog: Tpl[]; enabledIds: string[]; limit: number; plan: string; lang: Lang }) {
  const ui = UI[lang];
  const router = useRouter();
  const [enabled, setEnabled] = useState<Set<string>>(new Set(enabledIds));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const activeCount = enabled.size;
  const capped = Number.isFinite(limit);

  async function toggle(id: string) {
    const next = !enabled.has(id);
    setBusy(true); setNotice(null);
    const res = await fetch("/api/rules", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ template_id: id, enabled: next }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setNotice(data.error ?? "Erreur"); return; }
    setEnabled((prev) => { const s = new Set(prev); if (next) s.add(id); else s.delete(id); return s; });
    router.refresh();
  }

  async function activateProfile(key: string) {
    setBusy(true); setNotice(null);
    const res = await fetch("/api/rules/profile", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ profile: key }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setNotice(data.error ?? "Erreur"); return; }
    // Le serveur renvoie exactement les IDs activés (respecte la troncature de plan).
    setEnabled((prev) => {
      const s = new Set(prev);
      (data.activated_ids ?? []).forEach((id: string) => s.add(id));
      return s;
    });
    if (data.message) setNotice(data.message);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between rounded-2xl border border-ink-100 bg-paper px-5 py-4 text-sm">
        <span>
          <span className="font-medium">{activeCount}</span> {ui.ruleActive}{activeCount > 1 ? "s" : ""}
          {capped && <span className="text-ink-400"> / {limit} {ui.ruleLimitFree}</span>}
        </span>
        {capped && (
          <a href="/dashboard" className="font-medium text-mint-500 hover:text-mint-400">{ui.unlockMore}</a>
        )}
      </div>

      {notice && <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-300">{notice}</p>}

      {PROFILES.map((p) => {
        const rules = catalog.filter((t) => t.profiles.includes(p.key));
        return (
          <section key={p.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">{ui.profile} {ui[p.label as "profPerso" | "profShop" | "profBuilder"]}</h2>
                <p className="text-sm text-ink-400">{ui[p.hint as "profPersoHint" | "profShopHint" | "profBuilderHint"]}</p>
              </div>
              <button disabled={busy} onClick={() => activateProfile(p.key)}
                className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium transition hover:border-mint-400 disabled:opacity-50">
                {ui.enableAll}
              </button>
            </div>
            <div className="space-y-2">
              {rules.map((t) => {
                const on = enabled.has(t.id);
                const sev = SEVERITY[t.severity] ?? SEVERITY.confirm;
                return (
                  <div key={t.id} className="flex items-center justify-between gap-4 rounded-xl border border-ink-100 bg-paper p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{t.label}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${sev.cls}`}>{ui[sev.label as "block" | "ask" | "notify"]}</span>
                      </div>
                      <p className="mt-1 text-sm text-ink-500">{t.description}</p>
                    </div>
                    <button role="switch" aria-checked={on} disabled={busy} onClick={() => toggle(t.id)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-mint-500" : "bg-ink-200"} disabled:opacity-50`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      <p className="pt-2 text-center text-xs text-ink-400">{ui.currentPlanIs} : {plan === "free" ? ui.planFree : plan === "protege" ? ui.planProtege : ui.planStudio}</p>
    </div>
  );
}
