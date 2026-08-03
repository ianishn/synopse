/**
 * Table de prix par modèle (EUR / million de tokens) pour l'estimation de coût (F4, ±15 %).
 * Mise à jour MANUELLE — vérifier les prix fournisseurs à chaque release.
 */
export const MODEL_PRICES_EUR_PER_MTOK: Record<string, { in: number; out: number }> = {
  "claude-haiku-4-5": { in: 0.9, out: 4.5 },
  "claude-sonnet-5": { in: 2.8, out: 14 },
  "claude-opus-5": { in: 14, out: 70 },
  "gpt-5.5": { in: 1.2, out: 9 },
};

export function estimateCostEur(model: string, tokensIn: number, tokensOut: number): number {
  const p = MODEL_PRICES_EUR_PER_MTOK[model];
  if (!p) return 0; // modèle inconnu : 0 mais loggé côté API pour ajout à la table
  return (tokensIn * p.in + tokensOut * p.out) / 1_000_000;
}
