/** Hub Compte : en-tête + menu latéral (Profil / Facturation / Paiements). */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountMenu } from "./account-menu";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="font-display text-lg font-bold tracking-tight text-off">
            synopse<span className="text-orange">.</span>
          </a>
          <a className="text-sm text-ink-400 hover:text-off" href="/dashboard">← Tableau de bord</a>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold">Mon compte</h1>
        <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
          <AccountMenu />
          <div>{children}</div>
        </div>
      </main>
    </div>
  );
}
