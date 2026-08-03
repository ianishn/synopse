/** GET /api/agents — liste les agents de l'utilisateur connecté (statut de connexion en direct). */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const { data } = await db.from("agents")
    .select("id, name, status, last_heartbeat_at")
    .eq("user_id", user.id).order("created_at");
  return NextResponse.json({ agents: data ?? [] });
}
