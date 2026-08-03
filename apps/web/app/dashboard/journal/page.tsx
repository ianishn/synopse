/** Journal lisible (F7) — événements 90 j, filtre par type via ?f=bloque|valide|info. */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const FILTERS: Record<string, string[]> = {
  bloque: ["blocked"],
  valide: ["approved", "denied", "budget_alert"],
  info: ["info", "usage"],
};

export default async function Journal({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { f } = await searchParams;

  const db = createServiceClient();
  const { data: agents } = await db.from("agents").select("id, name").eq("user_id", user.id);
  const ids = (agents ?? []).map((a) => a.id);
  const names = Object.fromEntries((agents ?? []).map((a) => [a.id, a.name]));
  let q = db.from("events").select("id, agent_id, type, summary_fr, created_at")
    .in("agent_id", ids).neq("type", "usage").order("created_at", { ascending: false }).limit(100);
  if (f && FILTERS[f]) q = q.in("type", FILTERS[f]);
  const { data: events } = await q;

  const icon = (t: string) =>
    t === "blocked" ? "🛡️" : t === "approved" ? "✅" : t === "denied" ? "❌" : t === "budget_alert" ? "💶" : "ℹ️";

  return (
    <main className="mx-auto mt-12 max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Journal</h1>
        <Link className="text-sm underline" href="/dashboard">← Tableau de bord</Link>
      </div>
      <nav className="flex gap-3 text-sm">
        {[["", "Tout"], ["bloque", "Bloqué"], ["valide", "Validations"], ["info", "Infos"]].map(([k, label]) => (
          <Link key={k} href={k ? `?f=${k}` : "?"}
            className={`rounded border px-2 py-1 ${f === k || (!f && !k) ? "bg-black text-white dark:bg-white dark:text-black" : ""}`}>
            {label}
          </Link>
        ))}
      </nav>
      <ul className="divide-y rounded border">
        {(events ?? []).map((e) => (
          <li key={e.id} className="p-3 text-sm">
            <span className="mr-2">{icon(e.type)}</span>{e.summary_fr}
            <span className="mt-1 block text-xs opacity-60">
              {names[e.agent_id]} · {new Date(e.created_at).toLocaleString("fr-FR")}
            </span>
          </li>
        ))}
        {!events?.length && <li className="p-4 text-sm opacity-60">Aucun événement pour l&apos;instant.</li>}
      </ul>
    </main>
  );
}
