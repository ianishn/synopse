/**
 * POST /api/pairing, crée un agent pour l'user connecté (session Supabase).
 * Renvoie le token EN CLAIR UNE SEULE FOIS (seul le hash est stocké) + le code de
 * liaison Telegram. Le dashboard affiche : `npx synopse connect <token>` (F1).
 * Limite plan Gratuit : 1 agent (enforcement côté API, spec F8).
 */
import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { name = "Mon agent" } = await request.json().catch(() => ({}));

  const db = createServiceClient();
  // Limite plan gratuit (V1 : tout le monde est "free" tant que F8 n'est pas branché → 1 agent).
  const { data: sub } = await db.from("subscriptions").select("plan").eq("user_id", user.id).single();
  const plan = sub?.plan ?? "free";
  const maxAgents = plan === "studio" ? 5 : plan === "protege" ? 1 : 1;
  const { count } = await db.from("agents").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if ((count ?? 0) >= maxAgents) {
    return NextResponse.json({ error: "limite d'agents atteinte pour ton plan" }, { status: 403 });
  }

  const token = `syn_${randomBytes(24).toString("hex")}`;
  const linkCode = randomBytes(6).toString("hex");
  const { data: agent, error } = await db
    .from("agents")
    .insert({
      user_id: user.id,
      name: String(name).slice(0, 60),
      pairing_token_hash: createHash("sha256").update(token).digest("hex"),
    })
    .select("id, name").single();
  if (error || !agent) return NextResponse.json({ error: "création impossible" }, { status: 500 });

  // Code de liaison Telegram (upsert : un seul réglage par user).
  await db.from("user_settings").upsert({ user_id: user.id, telegram_link_code: linkCode }).select();

  return NextResponse.json({
    agent_id: agent.id,
    name: agent.name,
    token, // affiché une seule fois, jamais restockable
    telegram_link_url: `https://t.me/SynGuardBot?start=${linkCode}`,
  });
}
