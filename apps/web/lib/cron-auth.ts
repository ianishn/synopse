/**
 * Auth des endpoints cron. On exige STRICTEMENT `Authorization: Bearer <CRON_SECRET>`.
 * Vercel Cron ajoute automatiquement cet en-tête quand la variable CRON_SECRET est définie.
 * On NE fait PAS confiance à l'en-tête `x-vercel-cron` : il est falsifiable par n'importe quel
 * appelant et permettrait de déclencher expirations/purges à volonté (DoS + effets de bord).
 */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // pas de secret configuré = tout est refusé (fail-safe)
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
