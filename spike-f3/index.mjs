/**
 * SPIKE F3 — Synopse : preuve d'interception before-execution (prototype jetable).
 * Règle en dur : tout tool call dont les paramètres contiennent un domaine inconnu
 * (hors allowlist) est mis en attente → validation Telegram → refus par défaut.
 */
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const ALLOWLIST = [
  "api.anthropic.com",
  "api.telegram.org",
  "localhost",
  "127.0.0.1",
  "synopse.eu",
];

const APPROVAL_TIMEOUT_MS = 120_000; // 2 min pour le spike (15 min en V1)
const TG = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

function findUnknownDomain(params) {
  const text = JSON.stringify(params);
  const domains = text.match(/(?:https?:\/\/|@|\b)([a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/gi) ?? [];
  for (const raw of domains) {
    const d = raw.replace(/^https?:\/\/|^@/i, "").toLowerCase();
    // ignore les faux positifs type extensions de fichiers
    if (/\.(ts|js|mjs|json|md|txt|png|jpg|csv|html|css)$/.test(d)) continue;
    if (!ALLOWLIST.some((a) => d === a || d.endsWith("." + a))) return d;
  }
  return null;
}

async function tg(method, body) {
  const res = await fetch(`${TG()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Envoie la demande, attend le tap sur un bouton. Toute erreur/timeout = refus (fail-safe). */
async function askTelegram(id, toolName, domain, params) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!process.env.TELEGRAM_BOT_TOKEN || !chatId) return "deny";

  const detail = JSON.stringify(params).slice(0, 700);
  const sent = await tg("sendMessage", {
    chat_id: chatId,
    text: `⚠️ Synopse — action sensible interceptée\n\nL'agent veut utiliser l'outil « ${toolName} » vers un domaine jamais vu : ${domain}\n\nDétail : ${detail}\n\nSans réponse d'ici 2 min → refus automatique.`,
    reply_markup: {
      inline_keyboard: [[
        { text: "❌ Refuser", callback_data: `deny:${id}` },
        { text: "✅ Autoriser une fois", callback_data: `allow:${id}` },
      ]],
    },
  });
  if (!sent?.ok) return "deny";

  const deadline = Date.now() + APPROVAL_TIMEOUT_MS;
  let offset = 0;
  while (Date.now() < deadline) {
    const upd = await tg("getUpdates", { timeout: 20, offset, allowed_updates: ["callback_query"] });
    if (!upd?.ok) return "deny";
    for (const u of upd.result ?? []) {
      offset = u.update_id + 1;
      const cq = u.callback_query;
      if (!cq?.data?.endsWith(`:${id}`)) continue;
      const verdict = cq.data.startsWith("allow") ? "allow" : "deny";
      await tg("answerCallbackQuery", { callback_query_id: cq.id });
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: sent.result.message_id,
        text: verdict === "allow"
          ? `✅ Autorisé une fois — « ${toolName} » vers ${domain}`
          : `🛡️ Bloqué par toi — « ${toolName} » vers ${domain}`,
      });
      return verdict;
    }
  }
  await tg("editMessageText", {
    chat_id: chatId,
    message_id: sent.result.message_id,
    text: `⏱️ Expiré sans réponse → refusé par défaut — « ${toolName} » vers ${domain}`,
  });
  return "deny";
}

export default definePluginEntry({
  id: "synopse-spike",
  name: "Synopse Spike F3",
  description: "Interception before-execution + validation Telegram (prototype)",
  register(api) {
    api.on("before_tool_call", async (event) => {
      const domain = findUnknownDomain(event.params ?? {});
      if (!domain) return; // rien de sensible → laisser passer

      const id = event.toolCallId ?? Math.random().toString(36).slice(2, 10);
      let verdict = "deny";
      try {
        verdict = await askTelegram(id, event.toolName, domain, event.params);
      } catch {
        verdict = "deny"; // fail-safe : Telegram injoignable = refus
      }
      if (verdict === "allow") return;
      return {
        block: true,
        blockReason: `Bloqué par Synopse : envoi vers un domaine inconnu (${domain}) refusé par le propriétaire. Continue ta tâche sans exécuter cette action.`,
      };
    });
  },
});
