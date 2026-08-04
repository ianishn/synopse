/** Dashboard V1 : agents (gérer/supprimer), règles, tuto, connecteur, billing. */
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AgentsPanel } from "./agents-panel";
import { BillingCard } from "./billing-card";
import { TutorialModal } from "./tutorial-modal";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = isAdmin(user.email);

  const db = createServiceClient();
  const { data: agents } = await db.from("agents")
    .select("id, name, status, last_heartbeat_at, daily_budget_eur")
    .eq("user_id", user.id).order("created_at");
  const today = new Date().toISOString().slice(0, 10);
  const { data: spend } = await db.from("spend").select("agent_id, est_cost_eur")
    .eq("day", today).in("agent_id", (agents ?? []).map((a) => a.id));
  const spendByAgent = Object.fromEntries((spend ?? []).map((s) => [s.agent_id, Number(s.est_cost_eur)]));
  const { data: sub } = await db.from("subscriptions").select("plan, status").eq("user_id", user.id).single();
  const plan = sub && sub.status !== "canceled" ? sub.plan : "free";
  const { count: activeRules } = await db.from("rules")
    .select("template_id", { count: "exact", head: true }).eq("user_id", user.id).eq("enabled", true);

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-100">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="font-display text-lg font-bold tracking-tight">
            synopse<span className="text-orange">.</span>
          </a>
          <div className="flex items-center gap-4 text-sm text-ink-500">
            {admin && <a className="font-medium text-orange hover:text-orange-bright" href="/admin">Admin</a>}
            <a className="hover:text-ink-900" href="/dashboard/rules">Règles</a>
            <a className="hover:text-ink-900" href="/dashboard/journal">Journal</a>
            <a className="hover:text-ink-900" href="/dashboard/account">Compte</a>
            <form action="/auth/signout" method="post">
              <button className="hover:text-ink-900">Se déconnecter</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-8 px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Tableau de bord</h1>
            <p className="mt-1 text-sm text-ink-500">Tes agents protégés, en un coup d&apos;œil.</p>
          </div>
          {/* Tutoriel animé en pop-up (connecter + gérer). */}
          <TutorialModal />
        </div>
        <AgentsPanel agents={agents ?? []} spendByAgent={spendByAgent} />

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Règles</h2>
          <a href="/dashboard/rules"
            className="flex items-center justify-between rounded-2xl border border-ink-100 bg-paper p-5 transition hover:border-mint-400">
            <div>
              <p className="font-medium">
                {activeRules ? `${activeRules} règle${activeRules > 1 ? "s" : ""} active${activeRules > 1 ? "s" : ""}` : "Aucune règle active"}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {activeRules ? "Gère ce que ton agent doit te demander." : "Choisis en un clic ce que ton agent doit te demander."}
              </p>
            </div>
            <span className="text-mint-500" aria-hidden>→</span>
          </a>
        </section>

        <BillingCard plan={plan} />
      </main>
    </div>
  );
}
