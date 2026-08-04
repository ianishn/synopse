"use client";
/** Profil : nom, email, mot de passe (via Supabase Auth côté client), suppression de compte. */
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

export function ProfileForm({ email, name }: { email: string; name: string }) {
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
    setMsg(error ? { ok: false, text: (error as { message?: string }).message ?? "Erreur" } : { ok: true, text: okText });
  }

  async function deleteAccount() {
    setBusy(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) { await supabase.auth.signOut(); location.href = "/"; }
    else { setBusy(false); setMsg({ ok: false, text: "Suppression impossible" }); }
  }

  return (
    <div className="space-y-5">
      {msg && <p className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? "bg-[var(--orange-soft)] text-orange" : "bg-red-500/10 text-red-300"}`}>{msg.text}</p>}

      <Card title="Nom affiché">
        <div className="flex gap-2">
          <input className={input} value={nameV} onChange={(e) => setNameV(e.target.value)} placeholder="Ton nom" />
          <button className={btn} disabled={busy} onClick={() => run(() => supabase.auth.updateUser({ data: { name: nameV } }), "Nom mis à jour.")}>Enregistrer</button>
        </div>
      </Card>

      <Card title="Adresse email" desc="Un email de confirmation sera envoyé à la nouvelle adresse.">
        <div className="flex gap-2">
          <input className={input} type="email" value={emailV} onChange={(e) => setEmailV(e.target.value)} />
          <button className={btn} disabled={busy} onClick={() => run(() => supabase.auth.updateUser({ email: emailV }), "Vérifie ta boîte mail pour confirmer.")}>Modifier</button>
        </div>
      </Card>

      <Card title="Mot de passe" desc="8 caractères minimum.">
        <div className="flex gap-2">
          <input className={input} type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Nouveau mot de passe" minLength={8} />
          <button className={btn} disabled={busy || pwd.length < 8} onClick={() => run(() => supabase.auth.updateUser({ password: pwd }).then((r) => { setPwd(""); return r; }), "Mot de passe mis à jour.")}>Changer</button>
        </div>
      </Card>

      <Card title="Supprimer mon compte" desc="Efface définitivement ton compte, tes agents et tout ton historique. Irréversible.">
        {!confirmDel ? (
          <button className="rounded-full border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10" onClick={() => setConfirmDel(true)}>
            Supprimer mon compte
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-300">Sûr ?</span>
            <button className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50" disabled={busy} onClick={deleteAccount}>Oui, tout supprimer</button>
            <button className="rounded-full border border-ink-200 px-4 py-2 text-sm transition hover:border-ink-400" onClick={() => setConfirmDel(false)}>Annuler</button>
          </div>
        )}
      </Card>
    </div>
  );
}
