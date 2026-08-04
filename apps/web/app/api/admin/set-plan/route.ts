/**
 * POST /api/admin/set-plan — outil de test admin : force le plan d'un utilisateur.
 * Réservé aux admins (ADMIN_EMAILS). Écrit directement dans `subscriptions` (sans Stripe),
 * ce qui suffit à débloquer/tester les fonctionnalités Protégé / Studio.
 */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { user_id, plan } = await request.json().catch(() => ({}));
  if (!user_id || !["free", "protege", "studio"].includes(plan)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const db = createServiceClient();
  await db.from("subscriptions").upsert({
    user_id,
    plan,
    status: plan === "free" ? "canceled" : "active",
  });
  return NextResponse.json({ ok: true, plan });
}
