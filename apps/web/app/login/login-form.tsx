"use client";
/** Formulaire connexion / inscription (bilingue via le cookie de langue). */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FallingPattern } from "@/components/ui/falling-pattern";
import { BorderBeam } from "@/components/ui/border-beam";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Logo } from "../logo";
import { LangSwitch } from "@/components/ui/lang-switch";
import { UI, type Lang } from "@/lib/lang";

const INPUT =
  "w-full rounded-xl border border-line bg-void/70 px-4 py-3 text-sm text-off placeholder:text-muted outline-none transition focus:border-orange";

export function LoginForm({ lang }: { lang: Lang }) {
  const ui = UI[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null); setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard"); router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (data.session) { router.push("/dashboard"); router.refresh(); }
        else { setNotice(ui.checkMail); setMode("signin"); }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : ui.genericError);
    } finally { setBusy(false); }
  }

  async function google() {
    setError(null);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google", options: { redirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : ui.googleUnavailable);
    }
  }

  const signup = mode === "signup";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <FallingPattern className="fixed inset-0 -z-10" />

      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-block"><Logo /></Link>
          <LangSwitch lang={lang} />
        </div>

        <div className="relative mt-6 overflow-hidden rounded-2xl border border-line bg-void/80 p-7 backdrop-blur-xl">
          <BorderBeam duration={14} borderWidth={1.5} />

          <h1 className="text-2xl font-bold text-off">{signup ? ui.protectAgent : ui.welcomeBack}</h1>
          <p className="mt-1 text-sm text-s400">
            {signup ? ui.signupSub : ui.signinSub}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-3">
            <input className={INPUT} type="email" placeholder={ui.emailPh} autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={INPUT} type="password" placeholder={ui.pwdPh}
              autoComplete={signup ? "new-password" : "current-password"}
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />

            {signup && password.length > 0 && <PasswordStrength value={password} className="pt-1" />}

            <ButtonColorful type="submit" disabled={busy} className="w-full justify-center"
              label={busy ? "…" : signup ? ui.createAccount : ui.signin} />
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />{ui.or}<span className="h-px flex-1 bg-line" />
          </div>

          <button onClick={google}
            className="w-full rounded-xl border border-line bg-void/60 py-3 text-sm font-medium text-off transition hover:border-s400">
            {ui.googleBtn}
          </button>

          {notice && <p className="mt-4 rounded-xl border border-orange/30 bg-[var(--orange-soft)] px-4 py-3 text-sm text-orange">{notice}</p>}
          {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

          <button className="mt-6 w-full text-center text-sm text-muted transition hover:text-off"
            onClick={() => { setMode(signup ? "signin" : "signup"); setError(null); setNotice(null); }}>
            {signup ? ui.hasAccount : ui.noAccount}
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-muted">
          {ui.freeNoCard} <span className="text-s400">{ui.in3min}</span>
        </p>
      </div>
    </main>
  );
}
