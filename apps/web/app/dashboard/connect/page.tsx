/** Page connecteur (F1) — génère un token de pairing et guide la connexion de l'agent. */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConnectFlow } from "./connect-flow";

export const dynamic = "force-dynamic";

export default async function ConnectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-100">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="font-display text-lg font-bold tracking-tight">
            synopse<span className="text-mint-500">.</span>
          </a>
          <a className="text-sm text-ink-500 hover:text-ink-900" href="/dashboard">← Tableau de bord</a>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold">Connecter un agent</h1>
          <p className="mt-1 text-sm text-ink-500">
            Trois étapes, moins de 3 minutes. Besoin d&apos;aide ? <a href="/dashboard/tuto" className="text-mint-500 hover:text-mint-400">Voir le tutoriel animé</a>.
          </p>
        </div>
        <ConnectFlow />
      </main>
    </div>
  );
}
