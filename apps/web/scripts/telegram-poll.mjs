/**
 * DEV UNIQUEMENT — remplace le webhook Telegram en local (localhost n'est pas joignable par Telegram).
 * Long-poll getUpdates et applique la même logique que /api/telegram/webhook.
 * Usage : node scripts/telegram-poll.mjs (depuis apps/web, .env.local rempli).
 * En prod : setWebhook vers https://www.synopse.eu/api/telegram/webhook (voir docs/BACKEND.md).
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
);
const TG = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;
const SB = env.NEXT_PUBLIC_SUPABASE_URL;
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "content-type": "application/json" };

const tg = (m, b) => fetch(`${TG}/${m}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("Poller Telegram démarré (Ctrl+C pour arrêter)…");
let offset = 0;
for (;;) {
  // Résilience : une erreur réseau ponctuelle ne doit pas tuer le poller.
  let upd;
  try { upd = await tg("getUpdates", { timeout: 25, offset }); }
  catch { await sleep(3000); continue; }
  for (const u of upd.result ?? []) {
    offset = u.update_id + 1;
    const cq = u.callback_query;
    if (!cq?.data?.startsWith("appr:")) continue;
    const [, id, verdict] = cq.data.split(":");
    const status = verdict === "allow" ? "approved" : "denied";
    const res = await fetch(
      `${SB}/rest/v1/approvals?id=eq.${id}&status=eq.pending&expires_at=gt.${new Date().toISOString()}`,
      { method: "PATCH", headers: { ...H, Prefer: "return=representation" },
        body: JSON.stringify({ status, decided_via: "telegram", decided_at: new Date().toISOString() }) }
    ).then((r) => r.json());
    await tg("answerCallbackQuery", { callback_query_id: cq.id });
    if (res[0]) {
      await fetch(`${SB}/rest/v1/events`, { method: "POST", headers: H,
        body: JSON.stringify({ agent_id: res[0].agent_id, type: status, summary_fr: `${status === "approved" ? "Autorisé" : "Refusé"} par toi (Telegram) — ${res[0].action_summary.slice(0, 200)}` }) });
      await tg("editMessageText", { chat_id: cq.message.chat.id, message_id: cq.message.message_id,
        text: `${status === "approved" ? "✅ Autorisé" : "🛡️ Refusé"} — ${res[0].action_summary.slice(0, 300)}` });
      console.log(`${status}: ${res[0].action_summary.slice(0, 80)}`);
    }
  }
}
