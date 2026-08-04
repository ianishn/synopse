/** POST /api/agent/heartbeat, vivant + statut (kill switch) + etag config. */
import { NextResponse } from "next/server";
import { authAgent } from "@/lib/agent-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { computeConfig } from "@/lib/compile-config";

export async function POST(request: Request) {
  const agent = await authAgent(request);
  if (!agent) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = createServiceClient();
  await db.from("agents").update({
    last_heartbeat_at: new Date().toISOString(),
    // Un agent muet redevient actif quand il reparle (sauf gel manuel).
    ...(agent.status === "silent" ? { status: "active" } : {}),
  }).eq("id", agent.id);
  const config = await computeConfig(db, agent);
  return NextResponse.json({
    agent_status: agent.status === "frozen" ? "frozen" : "active",
    config_etag: config.etag,
  });
}
