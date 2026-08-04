/** POST /api/agents/freeze-all — kill switch : gèle (ou dégèle) TOUS les agents de l'utilisateur. */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { frozen } = await request.json().catch(() => ({ frozen: true }));

  const db = createServiceClient();
  const { data: touched } = await db.from("agents")
    .update({ status: frozen ? "frozen" : "active" })
    .eq("user_id", user.id).select("id");
  for (const a of touched ?? []) {
    await db.from("events").insert({
      agent_id: a.id, type: "info",
      summary_fr: frozen ? "🧊 Gelé par toi (kill switch dashboard)" : "▶️ Dégelé par toi (dashboard)",
    });
  }
  return NextResponse.json({ ok: true, count: touched?.length ?? 0 });
}
