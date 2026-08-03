import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les routes.
 * - HSTS : force HTTPS (Vercel l'ajoute déjà, explicite = ceinture + bretelles).
 * - X-Frame-Options + CSP frame-ancestors : anti-clickjacking (protège /dashboard).
 * - nosniff : empêche le MIME-sniffing.
 * - Referrer-Policy : ne fuite pas l'URL complète vers les sites tiers.
 * - Permissions-Policy : coupe les API navigateur non utilisées.
 * NB : une CSP script-src/connect-src complète est recommandée en suivi (nécessite un test
 * navigateur pour ne rien casser) — voir docs/BACKEND.md §Sécurité.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  // @synopse/shared est publié en source TS : Next le transpile lui-même.
  transpilePackages: ["@synopse/shared"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
