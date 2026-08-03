/**
 * Évaluateur de matchers — tourne LOCALEMENT dans le plugin (latence nulle, vie privée).
 * Sémantique : conditions présentes combinées en AND ; condition absente = non contraignante.
 * Validé par les tests `src/evaluate.test.ts` (node --test, 20+ cas dont les scénarios d'attaque).
 */
import type { RuleMatcher } from "./rules";

export type MatchResult = {
  matched: boolean;
  /** Détail FR pour les notifications ("domaine jamais vu : x.net"). */
  reason_fr?: string;
  matched_domain?: string;
  matched_amount?: number;
};

const NO_MATCH: MatchResult = { matched: false };

/** Extensions fichiers courantes — évite les faux positifs de la détection de domaine. */
const FILE_EXT_RE = /\.(ts|js|mjs|cjs|json|md|txt|png|jpe?g|gif|svg|csv|html?|css|pdf|zip|tar|gz|yml|yaml|toml|lock|env|sql|py|sh|ps1)$/i;

export function extractDomains(text: string): string[] {
  const found = text.match(/(?:https?:\/\/|@|\b)([a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/gi) ?? [];
  const out: string[] = [];
  for (const raw of found) {
    const d = raw.replace(/^https?:\/\/|^@/i, "").toLowerCase();
    if (!FILE_EXT_RE.test(d)) out.push(d);
  }
  return [...new Set(out)];
}

/** Montants EUR détectés : "12,50 €", "EUR 300", "9.99€", "montant: 45 eur". */
export function extractAmountsEur(text: string): number[] {
  const out: number[] = [];
  const re = /(?:€|eur(?:os?)?\s*[:=]?\s*)\s*(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur(?:os?)?\b)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(parseFloat((m[1] ?? m[2]).replace(",", ".")));
  return out;
}

function inForbiddenHours([start, end]: [number, number], hour: number): boolean {
  // Fenêtre pouvant passer minuit : [23, 7] = 23h..6h59.
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
}

export function evaluateMatcher(
  matcher: RuleMatcher,
  toolName: string,
  params: unknown,
  now: Date = new Date()
): MatchResult {
  const text = JSON.stringify(params ?? {});

  if (matcher.tool_names && !matcher.tool_names.includes(toolName)) return NO_MATCH;

  if (matcher.params_pattern) {
    // Regex venant de la config compilée (serveur de confiance). "iu" : insensible à la casse.
    if (!new RegExp(matcher.params_pattern, "iu").test(text)) return NO_MATCH;
  }

  if (matcher.forbidden_hours && !inForbiddenHours(matcher.forbidden_hours, now.getHours())) {
    return NO_MATCH;
  }

  let matched_domain: string | undefined;
  if (matcher.domain_allowlist) {
    const allow = matcher.domain_allowlist.map((d) => d.toLowerCase());
    matched_domain = extractDomains(text).find(
      (d) => !allow.some((a) => d === a || d.endsWith("." + a))
    );
    if (!matched_domain) return NO_MATCH;
  }

  let matched_amount: number | undefined;
  if (matcher.max_amount_eur !== undefined) {
    matched_amount = extractAmountsEur(text).find((a) => a > matcher.max_amount_eur!);
    if (matched_amount === undefined) return NO_MATCH;
  }

  // Toutes les conditions présentes sont vraies → match.
  const reasons: string[] = [];
  if (matched_domain) reasons.push(`domaine jamais vu : ${matched_domain}`);
  if (matched_amount !== undefined) reasons.push(`montant détecté : ${matched_amount} €`);
  if (matcher.forbidden_hours) reasons.push(`plage horaire interdite (${matcher.forbidden_hours[0]}h–${matcher.forbidden_hours[1]}h)`);
  return { matched: true, reason_fr: reasons.join(" ; ") || undefined, matched_domain, matched_amount };
}
