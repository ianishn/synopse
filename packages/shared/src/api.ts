/**
 * Contrat API plugin ↔ backend — source de vérité unique (zéro drift de contrat).
 * Auth : header `Authorization: Bearer <token-agent>` (token en clair côté plugin,
 * seul son SHA-256 est stocké en DB → révocable en supprimant le hash).
 * Fail-safe côté plugin : API injoignable = politique locale (block bloque, confirm refuse).
 */
import type { CompiledConfig } from "./rules.js";

/** POST /api/agent/events — journal + usage tokens (batch possible). */
export type PostEventsRequest = {
  events: Array<{
    type: "usage" | "info" | "task_done";
    summary_fr?: string;
    /** Pour type=usage : compteurs du tool call. */
    tokens_in?: number;
    tokens_out?: number;
    model?: string;
    meta?: Record<string, unknown>;
  }>;
};
export type PostEventsResponse = { ok: true };

/** POST /api/agent/approvals — création d'une demande de validation (règle confirm matchée). */
export type PostApprovalRequest = {
  rule_id: string;
  action_summary: string; // résumé FR déterministe généré par le plugin
  tool_name: string;
  /** Params sérialisés — chiffrés côté serveur avant stockage. */
  payload_json: string;
};
export type PostApprovalResponse = {
  approval_id: string;
  status: "pending";
  expires_at: string;
};

/** GET /api/agent/approvals/:id — polling du verdict (backoff progressif côté plugin). */
export type GetApprovalResponse = {
  status: "pending" | "approved" | "denied" | "expired";
};

/** POST /api/agent/heartbeat — toutes les 5 min. Réponse = statut (kill switch piggyback). */
export type PostHeartbeatResponse = {
  agent_status: "active" | "frozen";
  /** Etag config courant — s'il diffère de celui du plugin, re-GET /api/agent/config. */
  config_etag: string;
};

/** GET /api/agent/config — règles compilées. 304 si If-None-Match == etag courant. */
export type GetConfigResponse = CompiledConfig;
