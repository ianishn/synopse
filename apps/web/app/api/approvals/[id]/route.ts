/**
 * POST /api/approvals/:id — décide une approbation depuis le dashboard (web), body { verdict }.
 * Symétrique du webhook Telegram : la même approbation se résout des deux surfaces.
 */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { verdict } = await request.json().catch(() => ({}));
  const status = verdict === "approved" ? "approved" : "denied";

  const db = createServiceClient();
  // Vérifie que l'approbation appartient à un agent de l'utilisateur, encore en attente et non expirée.
  const { data: appr } = await db
    .from("approvals")
    .select("id, agent_id, action_summary, agents!inner(user_id)")
    .eq("id", id).eq("status", "pending").gt("expires_at", new Date().toISOString()).single();
  if (!appr || (appr.agents as unknown as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await db.from("approvals").update({ status, decided_via: "web", decided_at: new Date().toISOString() }).eq("id", id);
  await db.from("events").insert({
    agent_id: appr.agent_id, type: status,
    summary_fr: `${status === "approved" ? "Autorisé" : "Refusé"} par toi (dashboard), ${appr.action_summary.slice(0, 200)}`,
  });
  return NextResponse.json({ ok: true, status });
}
