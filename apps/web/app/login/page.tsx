"use client";
/** Login minimal (email/mot de passe + Google). UI définitive au build F1/F9. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Client créé à l'usage (pas au rendu) : le prérendu du build n'exige pas les clés env.
    const supabase = createClient();
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  async function google() {
    await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <main className="mx-auto mt-24 max-w-sm space-y-4 p-6">
      <h1 className="text-2xl font-bold">Synopse</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full rounded border p-2" type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded border p-2" type="password" placeholder="Mot de passe"
          value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        <button className="w-full rounded bg-black p-2 text-white" type="submit">
          {mode === "signin" ? "Se connecter" : "Créer le compte"}
        </button>
      </form>
      <button className="w-full rounded border p-2" onClick={google}>Continuer avec Google</button>
      <button className="w-full text-sm underline"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
        {mode === "signin" ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </main>
  );
}
