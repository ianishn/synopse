/**
 * DELETE /api/agents/:id — supprime un agent de l'utilisateur connecté.
 * Cascade DB (FK on delete cascade) : approbations, events, spend liés partent avec.
 * Le token de pairing devient invalide → le plugin reçoit 401 et applique son fail-safe.
 */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const db = createServiceClient();
  const { data, error } = await db.from("agents")
    .delete()
    .eq("id", id).eq("user_id", user.id) // garde : uniquement SES agents
    .select("id").single();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
