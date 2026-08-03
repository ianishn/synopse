import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les routes.
 * - HSTS : force HTTPS.
 * - X-Frame-Options + CSP frame-ancestors : anti-clickjacking (protège /dashboard).
 * - nosniff / Referrer-Policy / Permissions-Policy : durcissements standard.
 * - CSP complète (script/style/connect) : uniquement en PRODUCTION — en dev, Next utilise
 *   eval (React refresh) qui casserait avec une CSP stricte. On garde donc le dev souple.
 */
const isProd = process.env.NODE_ENV === "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWss = supabaseUrl.replace(/^https:/, "wss:");

// connect-src : origine de l'app + Supabase (REST/Auth + Realtime wss) + PostHog (beacon).
const connectSrc = ["'self'", supabaseUrl, supabaseWss, "https://eu.i.posthog.com"].filter(Boolean).join(" ");

const csp = isProd && supabaseUrl
  ? [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      // 'unsafe-inline' requis : Next injecte des scripts inline (hydratation) et Tailwind des styles inline.
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      `connect-src ${connectSrc}`,
      "upgrade-insecure-requests",
    ].join("; ")
  : "frame-ancestors 'none'"; // dev ou env manquante : on garde juste l'anti-framing (sans risque de casse).

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@synopse/shared"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
