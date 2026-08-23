import { NextResponse } from "next/server";
import { enabledEngines } from "@/lib/audit/enabled";
import { engineKeys, resend, stripe, supabase } from "@/lib/env";
import { enabledProviders } from "@/lib/auth-providers";
import { REQUIREMENTS, findMisnamed, findMissingPrefix } from "@/lib/env-names";
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

  // Uniquement des noms, jamais des valeurs.
  const present = new Set(
    Object.entries(process.env)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k]) => k),
  );

  const checks: Record<string, unknown> = {
    variables: {
      manquantes: REQUIREMENTS.filter((r) => !present.has(r.name)).map((r) => ({
        nom: r.name,
        requise: r.required,
        debloque: r.unlocks,
      })),
      malNommees: [...findMisnamed(present), ...findMissingPrefix(present)].map(
        (m) => ({ trouve: m.found, attendu: m.expected }),
      ),
    },
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    supabase: await checkSupabase(),
    connexion: {
      fournisseurs: enabledProviders(),
      variableRenseignee: process.env.NEXT_PUBLIC_AUTH_PROVIDERS !== undefined,
    },
    moteurs: await checkEngines(),
    couts: await checkCosts(),
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

/**
 * L'état de chaque moteur, et surtout sa dernière panne.
 *
 * Le navigateur ne voit jamais qu'« indisponible » — c'est volontaire, un
 * message de fournisseur contient des noms d'hôtes et des codes internes.
 * Mais celui qui exploite le site doit pouvoir lire la vraie cause, et elle
 * est déjà en base : chaque audit garde le message reçu. Cet écran est
 * protégé par jeton en production, donc c'est ici que ça se lit.
 */
async function checkEngines() {
  const cles: Record<string, boolean> = {
    chatgpt: Boolean(engineKeys.openai),
    claude: Boolean(engineKeys.anthropic),
    perplexity: Boolean(engineKeys.perplexity),
    gemini: Boolean(engineKeys.google),
  };

  // Un moteur coupé volontairement n'est pas une panne : le diagnostic doit
  // faire la différence, sinon on cherche un bug qui n'existe pas.
  const actifs = new Set<string>(enabledEngines());

  const etat: Record<string, unknown> = {};
  for (const [id, cle] of Object.entries(cles)) {
    etat[id] = { cle, actif: actifs.has(id), derniereErreur: null, quand: null };
  }

  const admin = supabaseAdmin();
  if (!admin) return etat;

  // Les 40 dernières lignes suffisent : on cherche la panne courante, pas
  // un historique.
  const { data } = await admin
    .from("audit_engines")
    .select("engine, status, detail, audit_id, audits!inner(created_at)")
    .eq("status", "error")
    .order("id", { ascending: false })
    .limit(40);

  for (const row of (data ?? []) as Array<{
    engine: string;
    detail: string | null;
    audits: { created_at: string } | { created_at: string }[];
  }>) {
    const current = etat[row.engine] as { derniereErreur: string | null } | undefined;
    if (!current || current.derniereErreur) continue;
    const audit = Array.isArray(row.audits) ? row.audits[0] : row.audits;
    etat[row.engine] = {
      cle: cles[row.engine] ?? false,
      actif: actifs.has(row.engine),
      derniereErreur: row.detail ?? "sans détail",
      quand: audit?.created_at ?? null,
    };
  }

  return etat;
}

/**
 * Ce que les audits ont coûté.
 *
 * C'est le chiffre qui décide du prix de vente. On donne la moyenne et le pire
 * cas sur les cinquante derniers audits chiffrés : la moyenne pour la marge,
 * le maximum parce que c'est lui qui fait mal quand quelqu'un enchaîne.
 */
async function checkCosts() {
  const admin = supabaseAdmin();
  if (!admin) return { chiffres: 0 };

  const { data } = await admin
    .from("audits")
    .select("cost_usd, measured_count")
    .not("cost_usd", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const couts = (data ?? [])
    .map((row) => Number(row.cost_usd))
    .filter((value) => Number.isFinite(value));

  if (couts.length === 0) {
    return {
      chiffres: 0,
      note: "aucun audit chiffré : renseigne les tarifs des moteurs (PRICE_*)",
    };
  }

  const total = couts.reduce((sum, value) => sum + value, 0);
  return {
    chiffres: couts.length,
    moyenUsd: Number((total / couts.length).toFixed(4)),
    maxUsd: Number(Math.max(...couts).toFixed(4)),
    minUsd: Number(Math.min(...couts).toFixed(4)),
  };
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
