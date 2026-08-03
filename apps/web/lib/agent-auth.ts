/**
 * Auth des endpoints plugin (/api/agent/*) : Bearer <token> → SHA-256 → agents.pairing_token_hash.
 * + chiffrement AES-256-GCM des payloads d'approbation (clé : PAYLOAD_ENCRYPTION_KEY).
 */
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { Agent } from "@synopse/shared";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Renvoie l'agent authentifié ou null (→ répondre 401). */
export async function authAgent(request: Request): Promise<Agent | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("agents").select("*").eq("pairing_token_hash", sha256(token)).single();
  return (data as Agent) ?? null;
}

const key = () => Buffer.from(process.env.PAYLOAD_ENCRYPTION_KEY!, "base64");

export function encryptPayload(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  // Format stocké : iv.tag.données (base64, séparés par des points)
  return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${enc.toString("base64")}`;
}

export function decryptPayload(stored: string): string {
  const [iv, tag, data] = stored.split(".").map((p) => Buffer.from(p, "base64"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}
