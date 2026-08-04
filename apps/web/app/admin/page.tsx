/**
 * Interface admin (/admin) — accès réservé (ADMIN_EMAILS).
 * Users + emails, abonnements, revenus (MRR/ARR estimés), répartition par forfait,
 * courbe d'évolution dans le temps.
 */
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin, PLAN_MONTHLY_EUR } from "@/lib/admin";
import { EvolutionChart } from "./chart";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) redirect("/dashboard");

  const db = createServiceClient();
  const { data: usersData } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = (usersData?.users ?? []).map((u) => ({ id: u.id, email: u.email ?? "", created_at: u.created_at }));
  const { data: subs } = await db.from("subscriptions").select("user_id, plan, status, created_at");

  const subByUser = new Map((subs ?? []).map((s) => [s.user_id, s]));
  const planOf = (uid: string) => {
    const s = subByUser.get(uid);
    return s && s.status !== "canceled" && s.plan !== "free" ? (s.plan as string) : "free";
  };

  // KPIs
  const totalUsers = users.length;
  const perPlan = { free: 0, protege: 0, studio: 0 } as Record<string, number>;
  for (const u of users) perPlan[planOf(u.id)] = (perPlan[planOf(u.id)] ?? 0) + 1;
  const paidCount = perPlan.protege + perPlan.studio;
  const mrr = perPlan.protege * PLAN_MONTHLY_EUR.protege + perPlan.studio * PLAN_MONTHLY_EUR.studio;
  const conv = totalUsers ? Math.round((paidCount / totalUsers) * 100) : 0;

  // Série temporelle cumulée (par jour)
  const signupTs = users.map((u) => new Date(u.created_at).getTime()).sort((a, b) => a - b);
  const paidTs = (subs ?? [])
    .filter((s) => s.status !== "canceled" && s.plan !== "free")
    .map((s) => new Date(s.created_at).getTime()).sort((a, b) => a - b);
  const dayset = new Set<number>();
  const day = (t: number) => { const d = new Date(t); d.setHours(23, 59, 59, 0); return d.getTime(); };
  [...signupTs, ...paidTs].forEach((t) => dayset.add(day(t)));
  dayset.add(day(Date.now()));
  const points = [...dayset].sort((a, b) => a - b).map((t) => ({
    t,
    users: signupTs.filter((s) => s <= t).length,
    paid: paidTs.filter((s) => s <= t).length,
  }));

  const kpis = [
    { label: "Utilisateurs", value: totalUsers },
    { label: "Abonnés payants", value: paidCount },
    { label: "MRR estimé", value: `${mrr} €` },
    { label: "ARR estimé", value: `${mrr * 12} €` },
    { label: "Conversion", value: `${conv} %` },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="font-display text-lg font-bold tracking-tight text-off">synopse<span className="text-orange">.</span> <span className="text-ink-400">admin</span></a>
          <a className="text-sm text-ink-400 hover:text-off" href="/dashboard">← Tableau de bord</a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <h1 className="text-2xl font-bold">Pilotage</h1>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-ink-100 bg-paper p-5">
              <p className="font-display text-2xl font-bold text-off">{k.value}</p>
              <p className="mt-1 text-xs text-ink-400">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Répartition par forfait */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Répartition par forfait</h2>
          <div className="grid grid-cols-3 gap-4">
            {[["Gratuit", perPlan.free], ["Protégé", perPlan.protege], ["Studio", perPlan.studio]].map(([label, n]) => (
              <div key={label as string} className="rounded-2xl border border-ink-100 bg-paper p-5">
                <p className="font-display text-xl font-bold text-off">{n as number}</p>
                <p className="mt-1 text-sm text-ink-400">{label as string}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Courbe */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Évolution dans le temps</h2>
          <EvolutionChart data={points} />
        </section>

        {/* Table users */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Utilisateurs ({totalUsers})</h2>
          <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-paper">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Inscrit le</th>
                  <th className="px-4 py-3 font-medium">Forfait</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {users
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((u) => {
                    const p = planOf(u.id);
                    return (
                      <tr key={u.id}>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3 text-ink-400">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p === "free" ? "bg-ink-100 text-ink-400" : "bg-[var(--orange-soft)] text-orange"}`}>
                            {p === "free" ? "Gratuit" : p === "protege" ? "Protégé" : "Studio"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                {users.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-ink-400">Aucun utilisateur.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
