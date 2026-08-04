/** GET /api/approvals — approbations EN ATTENTE de l'utilisateur, enrichies (agent, règle). */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data: agents } = await db.from("agents").select("id, name").eq("user_id", user.id);
  const ids = (agents ?? []).map((a) => a.id);
  const names = Object.fromEntries((agents ?? []).map((a) => [a.id, a.name]));
  if (ids.length === 0) return NextResponse.json({ pending: [] });

  const { data: rows } = await db.from("approvals")
    .select("id, agent_id, rule_id, action_summary, created_at, expires_at")
    .in("agent_id", ids).eq("status", "pending").gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const ruleIds = [...new Set((rows ?? []).map((r) => r.rule_id).filter(Boolean))];
  const { data: rules } = ruleIds.length
    ? await db.from("rules").select("id, template_id, rule_templates(label_fr)").in("id", ruleIds)
    : { data: [] };
  const ruleLabel = Object.fromEntries((rules ?? []).map((r) => [r.id, (r.rule_templates as unknown as { label_fr?: string })?.label_fr ?? "Règle"]));

  const pending = (rows ?? []).map((r) => ({
    id: r.id,
    agent: names[r.agent_id] ?? "Agent",
    action_summary: r.action_summary,
    rule: r.rule_id ? ruleLabel[r.rule_id] ?? null : null,
    created_at: r.created_at,
    expires_at: r.expires_at,
  }));
  return NextResponse.json({ pending });
}
