import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabase as config } from "@/lib/env";

/**
 * Client à clé de service. SERVEUR UNIQUEMENT — il contourne RLS.
 * Renvoie null quand Supabase n'est pas configuré : l'appelant continue sans
 * persistance plutôt que de planter.
 */
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient | null {
  if (!config.adminConfigured) return null;
  if (cached) return cached;

  cached = createClient(config.url!, config.serviceRoleKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
