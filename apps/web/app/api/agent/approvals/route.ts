/** POST /api/agent/approvals, crée la demande, chiffre le payload, notifie Telegram. */
import { NextResponse } from "next/server";
import { authAgent, encryptPayload } from "@/lib/agent-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { chatIdForUser, sendApprovalNotification } from "@/lib/telegram";
import type { PostApprovalRequest } from "@synopse/shared";

const TIMEOUT_MIN = 15;

export async function POST(request: Request) {
  const agent = await authAgent(request);
  if (!agent) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json()) as PostApprovalRequest;
  if (!body.action_summary) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const db = createServiceClient();
  const expires_at = new Date(Date.now() + TIMEOUT_MIN * 60_000).toISOString();
  const { data: approval, error } = await db
    .from("approvals")
    .insert({
      agent_id: agent.id,
      // Les règles système (ex. "system-budget") n'existent pas en DB → rule_id null.
      rule_id: /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(body.rule_id ?? "") ? body.rule_id : null,
      action_summary: body.action_summary.slice(0, 500),
      payload_encrypted: body.payload_json ? encryptPayload(body.payload_json.slice(0, 8000)) : null,
      expires_at,
    })
    .select("id").single();
  if (error || !approval) return NextResponse.json({ error: "insert failed" }, { status: 500 });

  await db.from("events").insert({
    agent_id: agent.id, type: "info",
    summary_fr: `Validation demandée, ${body.action_summary.slice(0, 200)}`,
  });

  // Notification best-effort : si Telegram échoue, la demande expire d'elle-même (refus par défaut).
  const chatId = await chatIdForUser(db, agent.user_id);
  if (chatId) {
    await sendApprovalNotification(chatId, approval.id, agent.name, body.action_summary, undefined).catch(() => {});
  }
  return NextResponse.json({ approval_id: approval.id, status: "pending", expires_at });
}
