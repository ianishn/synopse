/** POST /api/spend/cap — règle le plafond journalier/mensuel (€) sur tous les agents de l'utilisateur. */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { daily, monthly } = await request.json().catch(() => ({}));

  const patch: Record<string, number | null> = {};
  patch.daily_budget_eur = daily === "" || daily == null ? null : Math.max(0, Number(daily));
  patch.monthly_budget_eur = monthly === "" || monthly == null ? null : Math.max(0, Number(monthly));

  const db = createServiceClient();
  await db.from("agents").update(patch).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
