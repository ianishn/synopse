/**
 * Schéma des matchers de règles — évalués LOCALEMENT par le plugin (latence nulle, vie privée).
 * Un matcher matche si TOUTES ses conditions présentes sont vraies (AND).
 * Prouvé au spike F3 : l'évaluation se branche sur le hook before_tool_call d'OpenClaw.
 */
export type RuleMatcher = {
  /** Noms d'outils ciblés (ex. ["web_fetch", "exec"]). Absent = tous. */
  tool_names?: string[];
  /** Outils explicitement HORS périmètre (ex. écriture locale pour une règle d'exfiltration). */
  exclude_tool_names?: string[];
  /** Regex (source string) appliquée au JSON.stringify des params. */
  params_pattern?: string;
  /** Domaines à traiter comme inconnus s'ils ne sont PAS dans cette allowlist. */
  domain_allowlist?: string[];
  /** Plage horaire interdite, heures locales [début, fin) — ex. [23, 7]. */
  forbidden_hours?: [number, number];
  /** Montant max en EUR détecté dans les params (achats). */
  max_amount_eur?: number;
};

/** Config compilée servie au plugin par GET /api/agent/config (versionnée par etag). */
export type CompiledConfig = {
  etag: string;
  agent_status: "active" | "frozen" | "silent";
  rules: Array<{
    rule_id: string;
    severity: "block" | "confirm" | "notify";
    matcher: RuleMatcher;
    /** Libellé FR utilisé dans les notifications et blockReason. */
    label_fr: string;
  }>;
  /** Refus par défaut au timeout (ms) — fail-safe, jamais de fail-open. */
  approval_timeout_ms: number;
};
