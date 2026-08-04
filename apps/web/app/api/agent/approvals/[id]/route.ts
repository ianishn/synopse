/** GET /api/agent/approvals/:id, polling du verdict. Expiration paresseuse (le cron F6 fera le reste). */
import { NextResponse } from "next/server";
import { authAgent } from "@/lib/agent-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const agent = await authAgent(request);
  if (!agent) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const db = createServiceClient();
  const { data } = await db.from("approvals").select("status, expires_at, agent_id").eq("id", id).single();
  if (!data || data.agent_id !== agent.id) return NextResponse.json({ error: "not found" }, { status: 404 });

  let status = data.status;
  if (status === "pending" && new Date(data.expires_at) < new Date()) {
    status = "expired";
    await db.from("approvals").update({ status }).eq("id", id).eq("status", "pending");
    await db.from("events").insert({
      agent_id: agent.id, type: "denied",
      summary_fr: "Demande expirée sans réponse → refusée par défaut",
    });
  }
  return NextResponse.json({ status });
}
