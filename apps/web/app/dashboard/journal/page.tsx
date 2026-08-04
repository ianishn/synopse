/** Journal lisible (F7), rétention selon le plan (7 j en gratuit, 90 j en payant). */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { planForUser } from "@/lib/plan";

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
  const plan = await planForUser(db, user.id);
  // Rétention imposée côté serveur : 7 jours en gratuit, 90 jours en payant.
  const retentionDays = plan === "free" ? 7 : 90;
  const since = new Date(Date.now() - retentionDays * 86_400_000).toISOString();

  const { data: agents } = await db.from("agents").select("id, name").eq("user_id", user.id);
  const ids = (agents ?? []).map((a) => a.id);
  const names = Object.fromEntries((agents ?? []).map((a) => [a.id, a.name]));
  let q = db.from("events").select("id, agent_id, type, summary_fr, created_at")
    .in("agent_id", ids).neq("type", "usage").gte("created_at", since)
    .order("created_at", { ascending: false }).limit(100);
  if (f && FILTERS[f]) q = q.in("type", FILTERS[f]);
  const { data: events } = await q;

  const icon = (t: string) =>
    t === "blocked" ? "🛡️" : t === "approved" ? "✅" : t === "denied" ? "❌" : t === "budget_alert" ? "💶" : "ℹ️";

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-100">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="font-display text-lg font-bold tracking-tight">
            synopse<span className="text-mint-500">.</span>
          </a>
          <Link className="text-sm text-ink-500 hover:text-ink-900" href="/dashboard">← Tableau de bord</Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold">Journal</h1>
          <p className="mt-1 text-sm text-ink-500">
            Chaque action sensible, en clair. Conservé {retentionDays} jours.
            {plan === "free" && (
              <> <a href="/dashboard/account/billing" className="font-medium text-orange hover:text-orange-bright">Passe à Protégé pour 90 jours d&apos;historique</a>.</>
            )}
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          {[["", "Tout"], ["bloque", "Bloqué"], ["valide", "Validations"], ["info", "Infos"]].map(([k, label]) => (
            <Link key={k} href={k ? `?f=${k}` : "?"}
              className={`rounded-full px-4 py-1.5 transition ${
                f === k || (!f && !k)
                  ? "bg-orange text-white"
                  : "border border-ink-200 text-ink-600 hover:border-ink-400"
              }`}>
              {label}
            </Link>
          ))}
        </nav>
        <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100 bg-paper">
          {(events ?? []).map((e) => (
            <li key={e.id} className="flex gap-3 p-4 text-sm">
              <span className="text-base leading-none">{icon(e.type)}</span>
              <div>
                <p>{e.summary_fr}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {names[e.agent_id]} · {new Date(e.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
            </li>
          ))}
          {!events?.length && <li className="p-6 text-center text-sm text-ink-400">Aucun événement pour l&apos;instant.</li>}
        </ul>
      </main>
    </div>
  );
}
