import { NextResponse } from "next/server";
import { engineKeys, resend, stripe, supabase } from "@/lib/env";
import { enabledProviders } from "@/lib/auth-providers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * État de santé du déploiement.
 *
 * Sert à répondre depuis le serveur à la question que `npm run doctor` pose
 * en local : qu'est-ce qui manque ici ? Les variables vivent chez
 * l'hébergeur, pas sur la machine du développeur.
 *
 * Ne renvoie jamais une valeur de clé, seulement sa présence. En production,
 * l'accès demande un jeton : la carte de ce qui est branché ou non est déjà
 * une information utile à qui voudrait chercher une faille.
 */
const TABLES = ["audits", "audit_engines", "audit_prompts", "purchases", "profiles"];

export async function GET(request: Request) {
  const token = process.env.DIAGNOSTIC_TOKEN;
  const production = process.env.NODE_ENV === "production";

  if (production) {
    if (!token) {
      return NextResponse.json(
        { error: "DIAGNOSTIC_TOKEN absent : diagnostic désactivé en production." },
        { status: 404 },
      );
    }
    const given =
      new URL(request.url).searchParams.get("token") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (given !== token) {
      return NextResponse.json({ error: "jeton invalide" }, { status: 401 });
    }
  }

  const checks: Record<string, unknown> = {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    supabase: await checkSupabase(),
    connexion: {
      fournisseurs: enabledProviders(),
      variableRenseignee: process.env.NEXT_PUBLIC_AUTH_PROVIDERS !== undefined,
    },
    moteurs: {
      chatgpt: Boolean(engineKeys.openai),
      claude: Boolean(engineKeys.anthropic),
      perplexity: Boolean(engineKeys.perplexity),
      gemini: Boolean(engineKeys.google),
    },
    stripe: {
      cle: stripe.configured,
      webhook: Boolean(stripe.webhookSecret),
      mode: stripe.secretKey?.startsWith("sk_live_") ? "production" : "test",
    },
    email: { resend: resend.configured },
  };

  return NextResponse.json(checks, {
    headers: { "Cache-Control": "no-store" },
  });
}

async function checkSupabase() {
  if (!supabase.configured) {
    return { configure: false, cleDeService: false, tables: [], compteur: false };
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return { configure: true, cleDeService: false, tables: [], compteur: false };
  }

  const present: string[] = [];
  const manquantes: string[] = [];
  for (const table of TABLES) {
    const { error } = await admin.from(table).select("*", { head: true, count: "exact" }).limit(0);
    (error ? manquantes : present).push(table);
  }

  const { error: rpcError } = await admin.rpc("consume_rate_limit", {
    p_bucket: "sante",
    p_limit: 100000,
    p_window: "60 seconds",
  });

  return {
    configure: true,
    cleDeService: true,
    tables: present,
    tablesManquantes: manquantes,
    compteur: !rpcError,
  };
}
