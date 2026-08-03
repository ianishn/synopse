/**
 * Stripe sans SDK : fetch direct (form-encodé) — moins de dépendances, contrat stable.
 * Clés/prix : voir .env.example. Webhook : signature vérifiée si STRIPE_WEBHOOK_SECRET présent
 * (obligatoire en prod ; en dev local sans stripe CLI, absent = payload accepté avec warning).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.stripe.com/v1";

export async function stripe(path: string, params?: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}${path}`, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(params ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${(json.error as { message?: string })?.message}`);
  return json;
}

export function planFromPriceId(priceId: string): "protege" | "studio" | "free" {
  if (priceId === process.env.STRIPE_PRICE_PROTEGE) return "protege";
  if (priceId === process.env.STRIPE_PRICE_STUDIO) return "studio";
  return "free";
}

/** Vérifie l'en-tête Stripe-Signature (schéma t=...,v1=HMAC-SHA256("t.payload")). */
export function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  if (!parts.t || !parts.v1) return false;
  // Tolérance 5 min contre le rejeu.
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${payload}`).digest("hex");
  try { return timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1)); } catch { return false; }
}
