/** Dashboard V1 : agents + kill switch + pairing. (Journal et règles : étape suivante.) */
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { AgentsPanel } from "./agents-panel";
import { BillingCard } from "./billing-card";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  return (
    <main className="mx-auto mt-12 max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🛡️ Synopse</h1>
        <div className="flex gap-4 text-sm">
          <a className="underline" href="/dashboard/journal">Journal</a>
          <form action="/auth/signout" method="post">
            <button className="underline">Se déconnecter</button>
          </form>
        </div>
      </div>
      <AgentsPanel agents={agents ?? []} spendByAgent={spendByAgent} />
      <BillingCard plan={plan} />
    </main>
  );
}
