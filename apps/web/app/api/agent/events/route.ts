/** POST /api/agent/events — journal + agrégation usage→spend. Contrat : @synopse/shared api.ts */
import { NextResponse } from "next/server";
import { authAgent } from "@/lib/agent-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { estimateCostEur, type PostEventsRequest } from "@synopse/shared";

export async function POST(request: Request) {
  const agent = await authAgent(request);
  if (!agent) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json()) as PostEventsRequest;
  if (!Array.isArray(body.events)) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const db = createServiceClient();
  const rows = body.events.slice(0, 100).map((e) => ({
    agent_id: agent.id,
    type: e.type,
    summary_fr: (e.summary_fr ?? "").slice(0, 500),
    meta_json: e.meta ?? {},
  }));
  if (rows.length) await db.from("events").insert(rows);

  // Agrégat quotidien des tokens (un seul plugin écrit par agent → read-modify-write suffisant en V1).
  const usage = body.events.filter((e) => e.type === "usage" && (e.tokens_in || e.tokens_out));
  if (usage.length) {
    const day = new Date().toISOString().slice(0, 10);
    const { data: cur } = await db.from("spend").select("*").eq("agent_id", agent.id).eq("day", day).single();
    const add = usage.reduce(
      (a, e) => ({
        in: a.in + (e.tokens_in ?? 0),
        out: a.out + (e.tokens_out ?? 0),
        eur: a.eur + estimateCostEur(e.model ?? "", e.tokens_in ?? 0, e.tokens_out ?? 0),
      }),
      { in: 0, out: 0, eur: 0 }
    );
    await db.from("spend").upsert({
      agent_id: agent.id,
      day,
      tokens_in: (cur?.tokens_in ?? 0) + add.in,
      tokens_out: (cur?.tokens_out ?? 0) + add.out,
      est_cost_eur: Number(((cur?.est_cost_eur ?? 0) + add.eur).toFixed(4)),
    });
  }
  return NextResponse.json({ ok: true });
}
