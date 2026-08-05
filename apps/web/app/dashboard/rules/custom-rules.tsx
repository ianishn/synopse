"use client";
/**
 * Règles personnalisées (Studio) : liste + builder guidé.
 * Une règle = un nom + UNE condition (montant / domaines / outils / mots-clés / heures)
 * + une action (bloquer / demander / notifier). Aucune regex ni JSON exposé au client :
 * l'API construit le matcher à partir de champs typés.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UI, type Lang } from "@/lib/lang";

export type CustomRule = { id: string; label: string; severity: string; enabled: boolean };

const SEVERITY: Record<string, { label: string; cls: string }> = {
  block: { label: "block", cls: "bg-red-500/10 text-red-300" },
  confirm: { label: "ask", cls: "bg-mint-50 text-mint-500" },
  notify: { label: "notify", cls: "bg-amber-500/10 text-amber-300" },
};

type CondType = "amount" | "domains" | "tools" | "keywords" | "hours";

const splitList = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

export function CustomRules({ rules, plan, lang }: { rules: CustomRule[]; plan: string; lang: Lang }) {
  const ui = UI[lang];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [severity, setSeverity] = useState("confirm");
  const [condType, setCondType] = useState<CondType>("amount");
  const [amount, setAmount] = useState("");
  const [list, setList] = useState("");
  const [hourFrom, setHourFrom] = useState("22");
  const [hourTo, setHourTo] = useState("7");

  const CONDS: { key: CondType; label: string }[] = [
    { key: "amount", label: ui.condAmount },
    { key: "domains", label: ui.condDomains },
    { key: "tools", label: ui.condTools },
    { key: "keywords", label: ui.condKeywords },
    { key: "hours", label: ui.condHours },
  ];

  if (plan !== "studio") {
    return (
      <section className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-ink-200 bg-paper px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium">{ui.customTitle}</p>
          <p className="mt-0.5 text-sm text-ink-400">{ui.studioTeaser}</p>
        </div>
        <a href="/dashboard" className="shrink-0 rounded-full border border-mint-400/50 px-4 py-2 text-sm font-medium text-mint-500 transition hover:bg-mint-50">
          {ui.goStudio}
        </a>
      </section>
    );
  }

  async function create() {
    const conditions: Record<string, unknown> = {};
    if (condType === "amount") conditions.amount = Number(amount);
    if (condType === "domains") conditions.domains = splitList(list);
    if (condType === "tools") conditions.tools = splitList(list);
    if (condType === "keywords") conditions.keywords = splitList(list);
    if (condType === "hours") conditions.hours = [Number(hourFrom), Number(hourTo)];

    setBusy(true); setNotice(null);
    const res = await fetch("/api/rules/custom", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, severity, conditions }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setNotice(data.error ?? "Erreur"); return; }
    setLabel(""); setAmount(""); setList(""); setOpen(false);
    router.refresh();
  }

  async function toggle(r: CustomRule) {
    setBusy(true);
    await fetch(`/api/rules/custom/${r.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ enabled: !r.enabled }) });
    setBusy(false); router.refresh();
  }
  async function remove(r: CustomRule) {
    setBusy(true);
    await fetch(`/api/rules/custom/${r.id}`, { method: "DELETE" });
    setBusy(false); router.refresh();
  }

  const listField = condType === "domains" || condType === "tools" || condType === "keywords";
  const listPh = condType === "domains" ? ui.domainsPh : condType === "tools" ? ui.toolsPh : ui.keywordsPh;
  const canSubmit = label.trim().length >= 3 && !busy &&
    (condType === "amount" ? Number(amount) > 0 : listField ? splitList(list).length > 0 : hourFrom !== hourTo);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">{ui.customTitle}</h2>
          <p className="text-sm text-ink-400">{ui.customHint}</p>
        </div>
        <button disabled={busy} onClick={() => setOpen(!open)}
          className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium transition hover:border-mint-400 disabled:opacity-50">
          {open ? ui.cancel : ui.newRule}
        </button>
      </div>

      {notice && <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-300">{notice}</p>}

      {open && (
        <div className="space-y-4 rounded-xl border border-ink-100 bg-paper p-5">
          <div>
            <label htmlFor="cr-name" className="text-xs font-medium uppercase tracking-wide text-ink-400">{ui.ruleName}</label>
            <input id="cr-name" value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} placeholder={ui.ruleNamePh}
              className="mt-1.5 w-full rounded-xl border border-ink-200 bg-paper px-4 py-2.5 text-sm outline-none transition focus:border-mint-400" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cr-when" className="text-xs font-medium uppercase tracking-wide text-ink-400">{ui.whenLabel}</label>
              <select id="cr-when" value={condType} onChange={(e) => setCondType(e.target.value as CondType)}
                className="mt-1.5 w-full rounded-xl border border-ink-200 bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-mint-400">
                {CONDS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cr-then" className="text-xs font-medium uppercase tracking-wide text-ink-400">{ui.thenLabel}</label>
              <select id="cr-then" value={severity} onChange={(e) => setSeverity(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-ink-200 bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-mint-400">
                <option value="confirm">{ui.ask}</option>
                <option value="block">{ui.block}</option>
                <option value="notify">{ui.notify}</option>
              </select>
            </div>
          </div>

          {condType === "amount" && (
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={100000} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50"
                className="w-32 rounded-xl border border-ink-200 bg-paper px-4 py-2.5 text-sm outline-none transition focus:border-mint-400" />
              <span className="text-sm text-ink-400">€</span>
            </div>
          )}
          {listField && (
            <textarea value={list} onChange={(e) => setList(e.target.value)} placeholder={listPh} rows={2}
              className="w-full rounded-xl border border-ink-200 bg-paper px-4 py-2.5 text-sm outline-none transition focus:border-mint-400" />
          )}
          {condType === "hours" && (
            <div className="flex items-center gap-2 text-sm text-ink-400">
              {ui.hoursFrom}
              <input type="number" min={0} max={23} value={hourFrom} onChange={(e) => setHourFrom(e.target.value)}
                className="w-20 rounded-xl border border-ink-200 bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-mint-400" />
              h {ui.hoursTo}
              <input type="number" min={0} max={23} value={hourTo} onChange={(e) => setHourTo(e.target.value)}
                className="w-20 rounded-xl border border-ink-200 bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-mint-400" />
              h
            </div>
          )}

          <button disabled={!canSubmit} onClick={create}
            className="rounded-full bg-mint-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-mint-400 disabled:opacity-50">
            {ui.createRule}
          </button>
        </div>
      )}

      {rules.length === 0 && !open && (
        <p className="rounded-xl border border-dashed border-ink-200 px-5 py-6 text-center text-sm text-ink-400">{ui.noCustom}</p>
      )}
      <div className="space-y-2">
        {rules.map((r) => {
          const sev = SEVERITY[r.severity] ?? SEVERITY.confirm;
          return (
            <div key={r.id} className="flex items-center justify-between gap-4 rounded-xl border border-ink-100 bg-paper p-4">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-sm font-medium">{r.label}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${sev.cls}`}>{ui[sev.label as "block" | "ask" | "notify"]}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button disabled={busy} onClick={() => remove(r)} className="text-xs text-ink-400 transition hover:text-red-400 disabled:opacity-50">{ui.del}</button>
                <button role="switch" aria-checked={r.enabled} disabled={busy} onClick={() => toggle(r)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${r.enabled ? "bg-mint-500" : "bg-ink-200"} disabled:opacity-50`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${r.enabled ? "left-[1.375rem]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
