/**
 * Catalogue de règles FR — SOURCE DE VÉRITÉ du produit (fossé concurrentiel, spec F2).
 * Seedé en DB (rule_templates) par `pnpm --filter web seed:catalog` (étape F2 web).
 * Convention : id = slug stable (ne JAMAIS renommer un id publié, les rules y réfèrent).
 * `domain_allowlist: []` = tout domaine détecté est "inconnu" tant que l'user n'a rien
 * ajouté (params_json de la rule peut surcharger l'allowlist).
 */
import type { RuleTemplate } from "./db.js";

export const RULES_CATALOG: RuleTemplate[] = [
  // ---------- Communs / Perso ----------
  {
    id: "confirm-spending",
    label_fr: "Toujours me demander avant de dépenser de l'argent",
    description_fr: "Tout montant en euros détecté dans une action déclenche une validation.",
    matcher_json: { max_amount_eur: 0 },
    profiles: ["perso", "commercant", "builder"],
    default_severity: "confirm",
  },
  {
    id: "no-unknown-domain",
    label_fr: "Jamais d'envoi vers un domaine inconnu",
    description_fr: "Bloque l'exfiltration : tout envoi vers un site jamais vu demande validation.",
    matcher_json: { domain_allowlist: [] },
    profiles: ["perso", "commercant", "builder"],
    default_severity: "confirm",
  },
  {
    id: "no-destructive-delete",
    label_fr: "Jamais de suppression massive de fichiers",
    description_fr: "Les commandes de suppression destructrices sont bloquées net.",
    matcher_json: { params_pattern: "rm\\s+-rf|Remove-Item.*-Recurse|del\\s+/[sq]|rmdir\\s+/s|format\\s+[a-z]:" },
    profiles: ["perso", "commercant", "builder"],
    default_severity: "block",
  },
  {
    id: "night-quiet-messages",
    label_fr: "Pas d'envoi de messages entre 23h et 7h",
    description_fr: "Aucun mail, message ou publication ne part la nuit sans ta validation.",
    matcher_json: { params_pattern: "mail|message|send|post|publish|tweet", forbidden_hours: [23, 7] },
    profiles: ["perso", "commercant", "builder"],
    default_severity: "confirm",
  },
  {
    id: "confirm-outgoing-email",
    label_fr: "Toujours me demander avant d'envoyer un mail",
    description_fr: "Chaque envoi de mail est soumis à validation (contenu visible dans la demande).",
    matcher_json: { params_pattern: "\\b(sendmail|send_email|mailto:|smtp|\"to\"\\s*:)" },
    profiles: ["perso", "commercant"],
    default_severity: "confirm",
  },
  {
    id: "no-credentials-in-output",
    label_fr: "Jamais d'envoi de mots de passe ou de clés",
    description_fr: "Toute action contenant un secret apparent (clé API, mot de passe) est bloquée.",
    matcher_json: { params_pattern: "sk-[a-z0-9_-]{16,}|api[_-]?key|password\\s*[:=]|BEGIN (RSA|OPENSSH) PRIVATE KEY" },
    profiles: ["perso", "commercant", "builder"],
    default_severity: "block",
  },

  // ---------- Commerçant ----------
  {
    id: "confirm-client-message",
    label_fr: "Toujours me demander avant d'écrire à un client",
    description_fr: "Aucun message ne part vers un client sans ton accord.",
    matcher_json: { params_pattern: "client|customer" },
    profiles: ["commercant"],
    default_severity: "confirm",
  },
  {
    id: "confirm-publishing",
    label_fr: "Toujours me demander avant de publier (site, réseaux)",
    description_fr: "Publications sociales et mises en ligne soumises à validation.",
    matcher_json: { params_pattern: "publish|post_|instagram|facebook|tiktok|linkedin" },
    profiles: ["commercant"],
    default_severity: "confirm",
  },
  {
    id: "block-refunds",
    label_fr: "Jamais de remboursement sans moi",
    description_fr: "Tout remboursement ou avoir client est bloqué sans validation.",
    matcher_json: { params_pattern: "refund|rembours|avoir\\b" },
    profiles: ["commercant"],
    default_severity: "confirm",
  },
  {
    id: "spending-cap-50",
    label_fr: "Me demander pour tout achat au-dessus de 50 €",
    description_fr: "Les petits achats passent, au-delà de 50 € tu valides.",
    matcher_json: { max_amount_eur: 50 },
    profiles: ["commercant"],
    default_severity: "confirm",
  },

  // ---------- Builder ----------
  {
    id: "no-force-push",
    label_fr: "Jamais de git push --force",
    description_fr: "Le force push (perte d'historique possible) est bloqué.",
    matcher_json: { params_pattern: "push\\s+(--force|-f)\\b" },
    profiles: ["builder"],
    default_severity: "block",
  },
  {
    id: "confirm-package-publish",
    label_fr: "Toujours me demander avant de publier un package",
    description_fr: "npm publish, cargo publish, etc. soumis à validation.",
    matcher_json: { params_pattern: "npm publish|pnpm publish|cargo publish|pypi|twine upload" },
    profiles: ["builder"],
    default_severity: "confirm",
  },
  {
    id: "no-night-posting",
    label_fr: "Jamais de publication entre 23h et 7h",
    description_fr: "La règle qui a sauvé Maxime : rien ne se publie la nuit sans toi.",
    matcher_json: { params_pattern: "post|publish|tweet|toot", forbidden_hours: [23, 7] },
    profiles: ["builder"],
    default_severity: "confirm",
  },
  {
    id: "confirm-env-access",
    label_fr: "Me prévenir si l'agent lit des fichiers de secrets",
    description_fr: "Lecture de .env, credentials, clés SSH → notification immédiate.",
    matcher_json: { params_pattern: "\\.env\\b|credentials|id_rsa|\\.ssh|secrets?\\." },
    profiles: ["builder"],
    default_severity: "notify",
  },
  {
    id: "confirm-system-install",
    label_fr: "Toujours me demander avant d'installer un logiciel",
    description_fr: "Installations système et nouveaux skills soumis à validation.",
    matcher_json: { params_pattern: "npm i(nstall)?\\s+-g|winget install|apt(-get)? install|brew install|pip install|plugins? install" },
    profiles: ["perso", "builder"],
    default_severity: "confirm",
  },
  {
    id: "spending-cap-10",
    label_fr: "Me demander pour tout achat au-dessus de 10 €",
    description_fr: "Budget serré : au-delà de 10 €, tu valides.",
    matcher_json: { max_amount_eur: 10 },
    profiles: ["perso"],
    default_severity: "confirm",
  },
];

/** Profils exposés dans l'UI (un clic = activer toutes les règles du profil). */
export const PROFILES = ["perso", "commercant", "builder"] as const;
