/**
 * POST /api/spend/cap, règle le plafond journalier/mensuel (€) sur tous les agents.
 * Fonctionnalité PAYANTE (Protégé/Studio) : enforcement côté API, pas seulement dans l'UI.
 */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { planForUser } from "@/lib/plan";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const plan = await planForUser(db, user.id);
  if (plan === "free") {
    return NextResponse.json(
      { error: "Les plafonds de dépense sont inclus à partir du plan Protégé.", code: "upgrade" },
      { status: 403 },
    );
  }

  const { daily, monthly } = await request.json().catch(() => ({}));
  const patch: Record<string, number | null> = {
    daily_budget_eur: daily === "" || daily == null ? null : Math.max(0, Number(daily)),
    monthly_budget_eur: monthly === "" || monthly == null ? null : Math.max(0, Number(monthly)),
  };

  await db.from("agents").update(patch).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
