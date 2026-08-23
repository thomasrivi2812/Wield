import { supabaseAdmin } from "@/lib/supabase/admin";

export type RateLimitVerdict = {
  allowed: boolean;
  remaining: number;
  /** Vrai quand aucun compteur n'est disponible : on laisse passer, et on le sait. */
  unenforced: boolean;
};

/**
 * Compteur atomique en base (fonction `consume_rate_limit`).
 *
 * Sans Supabase configuré, on laisse passer plutôt que de bloquer le site —
 * mais `unenforced` remonte l'information pour qu'on ne croie pas être protégé.
 */
export async function consume(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitVerdict> {
  const admin = supabaseAdmin();
  if (!admin) return { allowed: true, remaining: limit, unenforced: true };

  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_bucket: bucket,
    p_limit: limit,
    p_window: `${windowSeconds} seconds`,
  });

  if (error) {
    // Un compteur en panne ne doit pas fermer le service, mais il est tracé.
    console.error("[rate-limit] échec du compteur", error.message);
    return { allowed: true, remaining: limit, unenforced: true };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(row?.allowed),
    remaining: Number(row?.remaining ?? 0),
    unenforced: false,
  };
}

/** L'IP appelante, derrière les proxys de Vercel. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "inconnue";
}
