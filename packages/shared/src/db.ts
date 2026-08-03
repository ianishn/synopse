/**
 * Types des lignes DB (miroir de supabase/migrations/0001_init.sql).
 * ⚠️ Toute modification du schéma SQL doit être répercutée ici (et inversement).
 */

import type { RuleMatcher } from "./rules.js";

export type AgentStatus = "active" | "frozen" | "silent";
export type RuleSeverity = "block" | "confirm" | "notify";
export type ApprovalStatus = "pending" | "approved" | "denied" | "expired";
export type Plan = "free" | "protege" | "studio";

export type Agent = {
  id: string;
  user_id: string;
  name: string;
  /** SHA-256 du token du plugin — le token en clair n'est JAMAIS stocké. */
  pairing_token_hash: string;
  framework: string; // "openclaw" en V1
  last_heartbeat_at: string | null;
  status: AgentStatus;
  created_at: string;
};

export type Rule = {
  id: string;
  user_id: string;
  /** null = règle globale (tous les agents du user) */
  agent_id: string | null;
  /** null = règle custom sans template */
  template_id: string | null;
  params_json: Record<string, unknown>;
  enabled: boolean;
  severity: RuleSeverity;
  created_at: string;
};

export type RuleTemplate = {
  id: string;
  label_fr: string;
  description_fr: string;
  matcher_json: RuleMatcher;
  profiles: string[]; // ["perso" | "commercant" | "builder"]
  default_severity: RuleSeverity;
};

export type Approval = {
  id: string;
  agent_id: string;
  rule_id: string | null;
  action_summary: string;
  /** Payload de l'action chiffré (AES-GCM, clé serveur) — jamais en clair en DB. */
  payload_encrypted: string | null;
  status: ApprovalStatus;
  expires_at: string;
  decided_via: string | null; // "telegram" | "web"
  created_at: string;
  decided_at: string | null;
};

export type EventRow = {
  id: number;
  agent_id: string;
  type: string; // "blocked" | "approved" | "denied" | "usage" | "heartbeat" | "info"
  summary_fr: string;
  meta_json: Record<string, unknown>;
  created_at: string;
};

export type Spend = {
  agent_id: string;
  day: string; // date ISO
  tokens_in: number;
  tokens_out: number;
  est_cost_eur: number;
};

export type Subscription = {
  user_id: string;
  stripe_customer_id: string | null;
  plan: Plan;
  status: string;
};
