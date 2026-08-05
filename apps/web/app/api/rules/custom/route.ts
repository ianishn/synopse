/**
 * POST /api/rules/custom — création d'une règle personnalisée (plan Studio uniquement).
 * Le client envoie des champs TYPÉS (jamais de matcher brut ni de regex libre) :
 *   { label, severity, conditions: { amount?, domains?, tools?, keywords?, hours? } }
 * Le matcher est construit et validé ICI — les mots-clés sont échappés avant de devenir
 * un params_pattern. Stockage : rules.template_id = null, params_json = { label_fr, ...matcher }
 * (contrat existant de compile-config : le matcher custom est fusionné tel quel).
 */
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { planForUser } from "@/lib/plan";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
const TOOL_RE = /^[\w.-]{1,50}$/;
const SEVERITIES = ["block", "confirm", "notify"] as const;

function bad(error: string) { return NextResponse.json({ error }, { status: 400 }); }

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = createServiceClient();
  const plan = await planForUser(db, user.id);
  if (plan !== "studio") {
    return NextResponse.json({ error: "Les règles personnalisées sont réservées au plan Studio.", code: "studio" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const label = String(body?.label ?? "").trim();
  const severity = body?.severity as (typeof SEVERITIES)[number];
  const c = (body?.conditions ?? {}) as Record<string, unknown>;

  if (label.length < 3 || label.length > 80) return bad("Nom de règle invalide (3 à 80 caractères).");
  if (!SEVERITIES.includes(severity)) return bad("Action invalide.");

  const matcher: Record<string, unknown> = {};

  if (c.amount !== undefined && c.amount !== null && c.amount !== "") {
    const n = Number(c.amount);
    if (!Number.isFinite(n) || n <= 0 || n > 100_000) return bad("Montant invalide (entre 1 et 100 000 €).");
    matcher.max_amount_eur = n;
  }
  if (Array.isArray(c.domains) && c.domains.length) {
    const domains = c.domains.map((d) => String(d).trim().toLowerCase()).filter(Boolean);
    if (domains.length > 30) return bad("30 domaines maximum.");
    for (const d of domains) if (!DOMAIN_RE.test(d)) return bad(`Domaine invalide : ${d.slice(0, 60)}`);
    matcher.domain_allowlist = domains;
  }
  if (Array.isArray(c.tools) && c.tools.length) {
    const tools = c.tools.map((t) => String(t).trim()).filter(Boolean);
    if (tools.length > 20) return bad("20 outils maximum.");
    for (const t of tools) if (!TOOL_RE.test(t)) return bad(`Nom d'outil invalide : ${t.slice(0, 60)}`);
    matcher.tool_names = tools;
  }
  if (Array.isArray(c.keywords) && c.keywords.length) {
    const kws = c.keywords.map((k) => String(k).trim()).filter(Boolean);
    if (kws.length > 20) return bad("20 mots-clés maximum.");
    for (const k of kws) if (k.length < 2 || k.length > 50) return bad("Chaque mot-clé doit faire 2 à 50 caractères.");
    matcher.params_pattern = kws.map(escapeRegex).join("|");
  }
  if (Array.isArray(c.hours) && c.hours.length === 2) {
    const [a, b] = c.hours.map(Number);
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || a > 23 || b < 0 || b > 23 || a === b) {
      return bad("Plage horaire invalide (heures 0-23, début ≠ fin).");
    }
    matcher.forbidden_hours = [a, b];
  }

  if (!Object.keys(matcher).length) return bad("Choisis au moins une condition.");

  const { data, error } = await db.from("rules").insert({
    user_id: user.id, template_id: null, agent_id: null, enabled: true, severity,
    params_json: { label_fr: label, ...matcher },
  }).select("id").single();
  if (error || !data) return NextResponse.json({ error: "échec de la création" }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
