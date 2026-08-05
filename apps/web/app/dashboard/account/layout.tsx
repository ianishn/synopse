/** Hub Compte : en-tête + menu latéral (identité, Profil/Préférences, Facturation/Paiements, déconnexion). */
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { planForUser } from "@/lib/plan";
import { AccountMenu } from "./account-menu";
import { getLang } from "@/lib/lang-server";
import { UI } from "@/lib/lang";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const lang = await getLang();
  const ui = UI[lang];
  const plan = await planForUser(createServiceClient(), user.id);
  const planLabel = plan === "studio" ? ui.planStudio : plan === "protege" ? ui.planProtege : ui.planFree;

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="font-display text-lg font-bold tracking-tight text-off">
            synopse<span className="text-orange">.</span>
          </a>
          <a className="text-sm text-ink-400 hover:text-off" href="/dashboard">← {lang === "fr" ? "Tableau de bord" : "Dashboard"}</a>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold">{ui.myAccount}</h1>
        <div className="grid gap-6 sm:grid-cols-[230px_1fr]">
          <AccountMenu lang={lang} name={(user.user_metadata?.name as string) ?? ""} email={user.email ?? ""} planLabel={planLabel} />
          <div>{children}</div>
        </div>
      </main>
    </div>
  );
}
