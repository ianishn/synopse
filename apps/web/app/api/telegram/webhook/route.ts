/**
 * Webhook Telegram (prod) — reçoit les taps de boutons et le lien de compte "/start <code>".
 * Sécurité : header X-Telegram-Bot-Api-Secret-Token == TELEGRAM_WEBHOOK_SECRET (défini au setWebhook).
 * En dev local : scripts/telegram-poll.mjs joue le même rôle via getUpdates.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { tg } from "@/lib/telegram";

export async function POST(request: Request) {
  if (request.headers.get("x-telegram-bot-api-secret-token") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const update = await request.json();
  const db = createServiceClient();

  // --- Tap sur un bouton d'approbation : "appr:<id>:allow|deny" ---
  const cq = update.callback_query;
  if (cq?.data?.startsWith("appr:")) {
    const [, approvalId, verdict] = cq.data.split(":");
    const status = verdict === "allow" ? "approved" : "denied";
    // Ne décide qu'une demande encore pending et non expirée (le timeout reste un refus).
    const { data: appr } = await db
      .from("approvals")
      .update({ status, decided_via: "telegram", decided_at: new Date().toISOString() })
      .eq("id", approvalId).eq("status", "pending").gt("expires_at", new Date().toISOString())
      .select("agent_id, action_summary").single();
    await tg("answerCallbackQuery", { callback_query_id: cq.id });
    if (appr) {
      await db.from("events").insert({
        agent_id: appr.agent_id,
        type: status,
        summary_fr: `${status === "approved" ? "Autorisé" : "Refusé"} par toi (Telegram) — ${appr.action_summary.slice(0, 200)}`,
      });
      await tg("editMessageText", {
        chat_id: cq.message.chat.id,
        message_id: cq.message.message_id,
        text: `${status === "approved" ? "✅ Autorisé" : "🛡️ Refusé"} — ${appr.action_summary.slice(0, 300)}`,
      });
    }
    return NextResponse.json({ ok: true });
  }

  // --- Kill switch : "STOP" gèle tous les agents du compte lié, "REPRISE" dégèle ---
  const msg = update.message;
  const cmd = msg?.text?.trim().toUpperCase();
  if (cmd === "STOP" || cmd === "REPRISE") {
    const { data: us } = await db.from("user_settings").select("user_id")
      .eq("telegram_chat_id", String(msg.chat.id)).single();
    if (!us) {
      await tg("sendMessage", { chat_id: msg.chat.id, text: "Compte non relié. Va sur ton tableau de bord Synopse pour relier Telegram." });
      return NextResponse.json({ ok: true });
    }
    const frozen = cmd === "STOP";
    const { data: touched } = await db.from("agents")
      .update({ status: frozen ? "frozen" : "active" })
      .eq("user_id", us.user_id).select("id, name");
    for (const a of touched ?? []) {
      await db.from("events").insert({
        agent_id: a.id, type: "info",
        summary_fr: frozen ? "🧊 Gelé par toi (Telegram STOP)" : "▶️ Dégelé par toi (Telegram REPRISE)",
      });
    }
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: frozen
        ? `🧊 ${touched?.length ?? 0} agent(s) gelé(s). Toute action est refusée (< 30 s). Tape REPRISE pour dégeler.`
        : `▶️ ${touched?.length ?? 0} agent(s) réactivé(s).`,
    });
    return NextResponse.json({ ok: true });
  }

  // --- Lien de compte : "/start <code>" ---
  const m = msg?.text?.match(/^\/start\s+(\S+)/);
  if (m) {
    const { data } = await db
      .from("user_settings")
      .update({ telegram_chat_id: String(msg.chat.id) })
      .eq("telegram_link_code", m[1]).select("user_id").single();
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: data
        ? "✅ Compte Synopse relié. Tu recevras ici les demandes de validation de ton agent."
        : "Code de liaison inconnu. Relance la liaison depuis ton tableau de bord Synopse.",
    });
  }
  return NextResponse.json({ ok: true });
}
