/**
 * GET /api/cron/weekly — rapport hebdo (F7), dimanche 18h (vercel.json / pinger externe).
 * Par user : agrégats 7 jours → Telegram (+ email Resend si RESEND_API_KEY présent).
 * Le rapport est le rituel anti-churn : chaque « tentative bloquée » = un renouvellement.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { chatIdForUser, tg } from "@/lib/telegram";

export async function GET(request: Request) {
  const authorized =
    request.headers.get("x-vercel-cron") ||
    request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  if (!authorized) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const db = createServiceClient();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: agents } = await db.from("agents").select("id, name, user_id, status");

  // Regroupement par user (un rapport par compte, tous agents confondus).
  const byUser = new Map<string, { name: string; ids: string[] }>();
  for (const a of agents ?? []) {
    const u = byUser.get(a.user_id) ?? { name: a.name, ids: [] };
    u.ids.push(a.id);
    byUser.set(a.user_id, u);
  }

  let sent = 0;
  for (const [userId, { ids }] of byUser) {
    const { data: events } = await db.from("events")
      .select("type").in("agent_id", ids).gte("created_at", since);
    const { data: spend } = await db.from("spend")
      .select("est_cost_eur").in("agent_id", ids).gte("day", since.slice(0, 10));

    const count = (t: string) => (events ?? []).filter((e) => e.type === t).length;
    const blocked = count("blocked");
    const cost = (spend ?? []).reduce((s, r) => s + Number(r.est_cost_eur), 0);
    const text =
      `📊 Ton rapport Synopse de la semaine\n\n` +
      `🛡️ ${blocked} action(s) bloquée(s)${blocked ? " — ton filet a servi !" : ""}\n` +
      `✅ ${count("approved")} validée(s) par toi · ❌ ${count("denied")} refusée(s)\n` +
      `💶 Coût estimé : ${cost.toFixed(2)} €\n\n` +
      `Détail : https://www.synopse.eu/dashboard/journal`;

    const chatId = await chatIdForUser(db, userId);
    if (chatId) { await tg("sendMessage", { chat_id: chatId, text }).catch(() => {}); sent++; }

    // Email optionnel (Resend) — activé dès que RESEND_API_KEY existe.
    if (process.env.RESEND_API_KEY) {
      const { data: u } = await db.auth.admin.getUserById(userId);
      if (u?.user?.email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
          body: JSON.stringify({
            from: "Synopse <rapport@synopse.eu>",
            to: u.user.email,
            subject: `Ton rapport Synopse — ${blocked} action(s) bloquée(s) cette semaine`,
            html: text.replace(/\n/g, "<br>"),
          }),
        }).catch(() => {});
      }
    }
  }
  return NextResponse.json({ reports_sent: sent });
}
