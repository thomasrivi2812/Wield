import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as config } from "@/lib/env";

/**
 * Client serveur adossé aux cookies de la requête.
 * Null quand Supabase n'est pas configuré.
 */
export async function supabaseServer(): Promise<SupabaseClient | null> {
  if (!config.configured) return null;

  const store = await cookies();

  return createServerClient(config.url!, config.anonKey!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) {
            store.set(name, value, options);
          }
        } catch {
          // Appelé depuis un Server Component : écrire un cookie y est
          // interdit. C'est le middleware qui rafraîchit la session.
        }
      },
    },
  });
}
