/** Page tuto, ouvre d'emblée la pop-up tutoriel animée (connecter + gérer). */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TutorialModal } from "../tutorial-modal";
import { getLang } from "@/lib/lang-server";

export const dynamic = "force-dynamic";

export default async function TutoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const lang = await getLang();
  const en = lang === "en";

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
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">{en ? "How does Synopse work?" : "Comment fonctionne Synopse ?"}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          {en ? "A 4-step guided tour: connect your agent, pick your rules, approve from Telegram, manage your agents." : "Un tour guidé en 4 étapes : connecter ton agent, choisir tes règles, valider depuis Telegram, gérer tes agents."}
        </p>
        <div className="mt-8 flex justify-center">
          {/* Ouvert d'emblée sur cette page dédiée. */}
          <TutorialModal defaultOpen lang={lang} label={en ? "Replay the tutorial" : "Revoir le tutoriel"} />
        </div>
      </main>
    </div>
  );
}
