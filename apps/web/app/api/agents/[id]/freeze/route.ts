/** POST /api/agents/:id/freeze — kill switch web (session). Body: { frozen: boolean }. */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { frozen } = await request.json().catch(() => ({ frozen: true }));

  const db = createServiceClient();
  const { data: agent } = await db.from("agents")
    .update({ status: frozen ? "frozen" : "active" })
    .eq("id", id).eq("user_id", user.id) // garde : uniquement SES agents
    .select("id, name, status").single();
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });

  await db.from("events").insert({
    agent_id: agent.id, type: "info",
    summary_fr: frozen ? "🧊 Gelé par toi (dashboard)" : "▶️ Dégelé par toi (dashboard)",
  });
  return NextResponse.json({ status: agent.status });
}
