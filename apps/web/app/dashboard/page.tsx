/** Dashboard — coquille protégée (middleware redirige si non connecté). UI au build F1+. */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto mt-24 max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p className="mt-2 text-sm">Connecté : {user.email}</p>
      <form action="/auth/signout" method="post" className="mt-6">
        <button className="rounded border p-2 text-sm">Se déconnecter</button>
      </form>
    </main>
  );
}
