/**
 * Envoi Telegram côté backend (bot unique Synopse).
 * Le chat_id vient de user_settings (lié via /start <code>), fallback env TELEGRAM_CHAT_ID (dev).
 * En prod le verdict revient par webhook /api/telegram/webhook ; en dev local par scripts/telegram-poll.mjs.
 */
const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function tg(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${API()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

import type { SupabaseClient } from "@supabase/supabase-js";

export async function chatIdForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase.from("user_settings").select("telegram_chat_id").eq("user_id", userId).single();
  return data?.telegram_chat_id ?? process.env.TELEGRAM_CHAT_ID ?? null;
}

/** Notification d'approbation avec boutons inline. callback_data : "appr:<id>:allow|deny". */
export async function sendApprovalNotification(
  chatId: string,
  approvalId: string,
  agentName: string,
  summary: string,
  reason: string | undefined
) {
  return tg("sendMessage", {
    chat_id: chatId,
    text: `⚠️ ${agentName} demande ta validation\n\n${summary}${reason ? `\n(${reason})` : ""}\n\nSans réponse d'ici 15 min → refus automatique.`,
    reply_markup: {
      inline_keyboard: [[
        { text: "❌ Refuser", callback_data: `appr:${approvalId}:deny` },
        { text: "✅ Autoriser une fois", callback_data: `appr:${approvalId}:allow` },
      ]],
    },
  });
}
