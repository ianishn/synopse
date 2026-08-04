/**
 * Contrôle d'accès admin. Un email est admin s'il figure dans ADMIN_EMAILS
 * (liste séparée par des virgules, dans les variables d'environnement).
 */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return allow.includes(email.toLowerCase());
}

/** Prix mensuel de référence par plan (pour l'estimation de MRR). */
export const PLAN_MONTHLY_EUR: Record<string, number> = { free: 0, protege: 9, studio: 19 };
