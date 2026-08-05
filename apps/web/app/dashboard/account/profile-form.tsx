"use client";
/** Profil : nom, email, mot de passe (via Supabase Auth côté client), suppression de compte. */
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

const input = "w-full rounded-xl border border-ink-200 bg-paper px-4 py-2.5 text-sm outline-none transition focus:border-orange";
const btn = "rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-bright disabled:opacity-50";

export function ProfileForm({ email, name, lang }: { email: string; name: string; lang: Lang }) {
  const ui = UI[lang];
  const supabase = createClient();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [nameV, setNameV] = useState(name);
  const [emailV, setEmailV] = useState(email);
  const [pwd, setPwd] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  async function run(fn: () => Promise<{ error: unknown }>, okText: string) {
    setBusy(true); setMsg(null);
    const { error } = await fn();
    setBusy(false);
    setMsg(error ? { ok: false, text: (error as { message?: string }).message ?? ui.genericErr } : { ok: true, text: okText });
  }

  async function deleteAccount() {
    setBusy(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) { await supabase.auth.signOut(); location.href = "/"; }
    else { setBusy(false); setMsg({ ok: false, text: ui.deleteFailed }); }
  }

  return (
    <div className="space-y-5">
      {msg && <p className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-[var(--orange-soft)] text-orange" : "bg-red-500/10 text-red-300"}`}>{msg.text}</p>}

      <Card title={ui.displayName}>
        <div className="flex gap-2">
          <input className={input} value={nameV} onChange={(e) => setNameV(e.target.value)} placeholder={ui.yourName} />
          <button className={btn} disabled={busy} onClick={() => run(() => supabase.auth.updateUser({ data: { name: nameV } }), ui.nameUpdated)}>{ui.save}</button>
        </div>
      </Card>

      <Card title={ui.emailAddr} desc={ui.emailHint}>
        <div className="flex gap-2">
          <input className={input} type="email" value={emailV} onChange={(e) => setEmailV(e.target.value)} />
          <button className={btn} disabled={busy} onClick={() => run(() => supabase.auth.updateUser({ email: emailV }), ui.checkInbox)}>{ui.modify}</button>
        </div>
      </Card>

      <Card title={ui.password} desc={ui.pwdHint}>
        <div className="flex gap-2">
          <input className={input} type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder={ui.newPwd} minLength={8} />
          <button className={btn} disabled={busy || pwd.length < 8} onClick={() => run(() => supabase.auth.updateUser({ password: pwd }).then((r) => { setPwd(""); return r; }), ui.pwdUpdated)}>{ui.change}</button>
        </div>
      </Card>

      <Card title={ui.deleteAccount} desc={ui.deleteHint}>
        {!confirmDel ? (
          <button className="rounded-full border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10" onClick={() => setConfirmDel(true)}>
            {ui.deleteAccount}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-300">{ui.sure}</span>
            <button className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50" disabled={busy} onClick={deleteAccount}>{ui.yesDeleteAll}</button>
            <button className="rounded-full border border-ink-200 px-4 py-2 text-sm transition hover:border-ink-400" onClick={() => setConfirmDel(false)}>{ui.cancel}</button>
          </div>
        )}
      </Card>
    </div>
  );
}
