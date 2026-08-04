"use client";
/** Connexion / inscription (email+mot de passe, Google). Gère la confirmation d'email Supabase. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        // Confirmation d'email activée : pas de session immédiate → on informe l'utilisateur.
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setNotice("Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion Google indisponible.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          synopse<span className="text-mint-500">.</span>
        </Link>
        <h1 className="mt-8 text-2xl font-bold">
          {mode === "signin" ? "Ravi de te revoir" : "Protège ton agent"}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {mode === "signin" ? "Connecte-toi à ton tableau de bord." : "Crée ton compte gratuit, aucune carte requise."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-3">
          <input
            className="w-full rounded-xl border border-ink-200 bg-paper px-4 py-3 text-sm outline-none transition focus:border-mint-400"
            type="email" placeholder="Adresse email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} required
          />
          <input
            className="w-full rounded-xl border border-ink-200 bg-paper px-4 py-3 text-sm outline-none transition focus:border-mint-400"
            type="password" placeholder="Mot de passe (8 caractères min.)"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
          />
          <button
            className="w-full rounded-xl bg-ink-950 py-3 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:opacity-50"
            type="submit" disabled={busy}
          >
            {busy ? "…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-ink-400">
          <span className="h-px flex-1 bg-ink-100" />ou<span className="h-px flex-1 bg-ink-100" />
        </div>

        <button
          onClick={google}
          className="w-full rounded-xl border border-ink-200 bg-paper py-3 text-sm font-medium transition hover:border-ink-400"
        >
          Continuer avec Google
        </button>

        {notice && <p className="mt-4 rounded-xl bg-mint-50 px-4 py-3 text-sm text-ink-700">{notice}</p>}
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <button
          className="mt-6 w-full text-center text-sm text-ink-500 hover:text-ink-900"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setNotice(null); }}
        >
          {mode === "signin" ? "Pas encore de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
        </button>
      </div>
    </main>
  );
}
