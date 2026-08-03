/**
 * Seed du catalogue de règles vers rule_templates (upsert idempotent, clé = id).
 * Usage : node --experimental-strip-types scripts/seed-catalog.mjs (depuis apps/web)
 * Relancer après chaque modif de packages/shared/src/catalog.ts.
 */
import { readFileSync } from "node:fs";
import { RULES_CATALOG } from "../../../packages/shared/src/catalog.ts";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);

const rows = RULES_CATALOG.map((t) => ({
  id: t.id,
  label_fr: t.label_fr,
  description_fr: t.description_fr,
  matcher_json: t.matcher_json,
  profiles: t.profiles,
  default_severity: t.default_severity,
}));

const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rule_templates?on_conflict=id`, {
  method: "POST",
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "content-type": "application/json",
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify(rows),
});
console.log(res.ok ? `✅ ${rows.length} templates seedés` : `❌ ${res.status} ${await res.text()}`);
