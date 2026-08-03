/**
 * Client Supabase côté serveur (Server Components / Route Handlers).
 * Session portée par les cookies — voir middleware.ts pour le refresh.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Appelé depuis un Server Component : ignoré, le middleware gère le refresh.
          }
        },
      },
    }
  );
}

/**
 * Client service_role — UNIQUEMENT pour les routes /api/agent/* (bypass RLS).
 * Ne jamais l'importer dans du code accessible au navigateur.
 */
import { createClient as createAdminClient } from "@supabase/supabase-js";
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Config serveur manquante : définis NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans les variables d'environnement Vercel (Production + Preview), puis redéploie."
    );
  }
  return createAdminClient(url, key, { auth: { persistSession: false } });
}
