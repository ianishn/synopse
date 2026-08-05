/**
 * DELETE /api/agents/:id, supprime un agent de l'utilisateur connecté.
 * Cascade DB (FK on delete cascade) : approbations, events, spend liés partent avec.
 * Le token de pairing devient invalide → le plugin reçoit 401 et applique son fail-safe.
 * PATCH /api/agents/:id, renomme l'agent et/ou change sa plateforme (openclaw | claude).
 */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const FRAMEWORKS = ["openclaw", "claude"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { name?: unknown; framework?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  const patch: { name?: string; framework?: string } = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name || name.length > 60) return NextResponse.json({ error: "invalid name" }, { status: 400 });
    patch.name = name;
  }
  if (body.framework !== undefined) {
    if (!FRAMEWORKS.includes(body.framework as (typeof FRAMEWORKS)[number])) {
      return NextResponse.json({ error: "invalid framework" }, { status: 400 });
    }
    patch.framework = body.framework as string;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "empty patch" }, { status: 400 });

  const db = createServiceClient();
  const { data, error } = await db.from("agents")
    .update(patch)
    .eq("id", id).eq("user_id", user.id) // garde : uniquement SES agents
    .select("id, name, framework").single();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}

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
