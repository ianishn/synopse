/** Client Supabase côté navigateur (composants "use client"). */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Ces NEXT_PUBLIC_* sont inlinées AU BUILD. Absentes = env Vercel non configurée
  // (ou ajoutée après le dernier build → redéployer).
  if (!url || !key) {
    throw new Error(
      "Configuration Supabase manquante : ajoute NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans les variables d'environnement Vercel (scope Preview + Production), puis redéploie."
    );
  }
  return createBrowserClient(url, key);
}
