/**
 * GET /api/cron/check — job de surveillance (F6), à appeler toutes les minutes.
 * Auth : header Vercel Cron (x-vercel-cron) OU Authorization: Bearer CRON_SECRET
 * (pour un pinger externe type cron-job.org si le plan Vercel limite la fréquence).
 * Fait : approvals expirées → refus ; agents silencieux > 15 min → alerte ; purge 90 j.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { chatIdForUser, tg } from "@/lib/telegram";
import { isCronAuthorized } from "@/lib/cron-auth";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const db = createServiceClient();
  const now = new Date().toISOString();

  // 1. Timeout des approbations = refus par défaut.
  const { data: expired } = await db.from("approvals")
    .update({ status: "expired" })
    .eq("status", "pending").lt("expires_at", now)
    .select("agent_id, action_summary");
  for (const a of expired ?? []) {
    await db.from("events").insert({
      agent_id: a.agent_id, type: "denied",
      summary_fr: `Expiré sans réponse → refusé — ${a.action_summary.slice(0, 200)}`,
    });
  }

  // 2. Heartbeat manquant > 15 min → silent + alerte (une fois, grâce au changement d'état).
  const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
  const { data: silent } = await db.from("agents")
    .update({ status: "silent" })
    .eq("status", "active").not("last_heartbeat_at", "is", null).lt("last_heartbeat_at", cutoff)
    .select("id, name, user_id");
  for (const a of silent ?? []) {
    await db.from("events").insert({
      agent_id: a.id, type: "info", summary_fr: "⚠️ Agent injoignable (aucun signe de vie depuis 15 min)",
    });
    const chatId = await chatIdForUser(db, a.user_id);
    if (chatId) await tg("sendMessage", {
      chat_id: chatId,
      text: `⚠️ ${a.name} ne donne plus signe de vie depuis 15 min. Vérifie que ton agent tourne toujours.`,
    }).catch(() => {});
  }

  // 3. Purge du journal > 90 jours (RGPD by design).
  await db.from("events").delete().lt("created_at", new Date(Date.now() - 90 * 86_400_000).toISOString());

  return NextResponse.json({ expired: expired?.length ?? 0, silent: silent?.length ?? 0 });
}
