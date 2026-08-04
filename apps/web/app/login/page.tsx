"use client";
/** Connexion / inscription : fond falling pattern, carte vitrée, force du mot de passe. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FallingPattern } from "@/components/ui/falling-pattern";
import { BorderBeam } from "@/components/ui/border-beam";
import { ButtonColorful } from "@/components/ui/button-colorful";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Logo } from "../logo";

const INPUT =
  "w-full rounded-xl border border-line bg-void/70 px-4 py-3 text-sm text-off placeholder:text-muted outline-none transition focus:border-orange";

export default function LoginPage() {
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
        else { setNotice("Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi."); setMode("signin"); }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
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
      setError(err instanceof Error ? err.message : "Connexion Google indisponible.");
    }
  }

  const signup = mode === "signup";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <FallingPattern className="fixed inset-0 -z-10" />

      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block"><Logo /></Link>

        <div className="relative mt-6 overflow-hidden rounded-2xl border border-line bg-void/80 p-7 backdrop-blur-xl">
          <BorderBeam duration={14} borderWidth={1.5} />

          <h1 className="text-2xl font-bold text-off">{signup ? "Protège ton agent" : "Ravi de te revoir"}</h1>
          <p className="mt-1 text-sm text-s400">
            {signup ? "Compte gratuit, aucune carte requise." : "Connecte-toi à ta tour de contrôle."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-3">
            <input className={INPUT} type="email" placeholder="Adresse email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={INPUT} type="password" placeholder="Mot de passe"
              autoComplete={signup ? "new-password" : "current-password"}
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />

            {signup && password.length > 0 && <PasswordStrength value={password} className="pt-1" />}

            <ButtonColorful type="submit" disabled={busy} className="w-full justify-center"
              label={busy ? "…" : signup ? "Créer mon compte" : "Se connecter"} />
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />ou<span className="h-px flex-1 bg-line" />
          </div>

          <button onClick={google}
            className="w-full rounded-xl border border-line bg-void/60 py-3 text-sm font-medium text-off transition hover:border-s400">
            Continuer avec Google
          </button>

          {notice && <p className="mt-4 rounded-xl border border-orange/30 bg-[var(--orange-soft)] px-4 py-3 text-sm text-orange">{notice}</p>}
          {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

          <button className="mt-6 w-full text-center text-sm text-muted transition hover:text-off"
            onClick={() => { setMode(signup ? "signin" : "signup"); setError(null); setNotice(null); }}>
            {signup ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? Créer un compte"}
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-muted">
          Gratuit · sans carte · <span className="text-s400">protégé en 3 minutes</span>
        </p>
      </div>
    </main>
  );
}
