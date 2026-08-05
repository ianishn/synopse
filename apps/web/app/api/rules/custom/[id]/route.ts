/**
 * PATCH /api/rules/custom/:id — active/désactive une règle personnalisée.
 * DELETE /api/rules/custom/:id — la supprime (approvals liés : FK on delete set null).
 * Garde : uniquement les règles custom (template_id null) du user connecté.
 */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { enabled } = await request.json().catch(() => ({}));
  if (typeof enabled !== "boolean") return NextResponse.json({ error: "bad request" }, { status: 400 });

  const db = createServiceClient();
  const { data, error } = await db.from("rules")
    .update({ enabled })
    .eq("id", id).eq("user_id", user.id).is("template_id", null)
    .select("id").single();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, enabled });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const db = createServiceClient();
  const { data, error } = await db.from("rules")
    .delete()
    .eq("id", id).eq("user_id", user.id).is("template_id", null)
    .select("id").single();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
