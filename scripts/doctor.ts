/**
 * Diagnostic d'installation.
 *
 * Répond à une seule question : qu'est-ce qui manque pour que le site tourne
 * pour de vrai ? Chaque ligne dit ce qui va, ce qui ne va pas, et quoi faire.
 * Aucun test ne coûte d'argent : on n'interroge que des endpoints gratuits.
 *
 *   npm run doctor
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Level = "ok" | "warn" | "fail";
type Check = { level: Level; label: string; detail: string; fix?: string };

const checks: Check[] = [];
const add = (c: Check) => checks.push(c);

/* --- lecture de .env.local ------------------------------------------------ */

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const file of [".env.local", ".env"]) {
    try {
      const raw = readFileSync(resolve(process.cwd(), file), "utf8");
      for (const line of raw.split("\n")) {
        const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
        if (!match) continue;
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (value && !out[match[1]]) out[match[1]] = value;
      }
    } catch {
      // fichier absent : ce n'est pas une erreur, on le signale plus bas
    }
  }
  for (const [k, v] of Object.entries(process.env)) {
    if (v && !out[k]) out[k] = v;
  }
  return out;
}

const env = loadEnv();
const has = (name: string) => Boolean(env[name]?.trim());

/* --- Supabase ------------------------------------------------------------- */

async function checkSupabase() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;

  // Contrôle purement textuel, fait avant tout appel réseau : une clé
  // intervertie doit être signalée même si le projet est injoignable.
  if (anon?.startsWith("sb_secret_") || anon?.includes("service_role")) {
    add({
      level: "fail",
      label: "Supabase — clés interverties",
      detail: "la clé SECRÈTE est dans une variable publique",
      fix: "NEXT_PUBLIC_SUPABASE_ANON_KEY doit recevoir la clé publishable (sb_publishable_…). Révoque la clé secrète exposée et régénère-la.",
    });
  }
  if (service?.startsWith("sb_publishable_")) {
    add({
      level: "fail",
      label: "Supabase — clés interverties",
      detail: "la clé publique est utilisée comme clé de service",
      fix: "SUPABASE_SERVICE_ROLE_KEY doit recevoir la clé secrète (sb_secret_…) : sans elle, rien ne s'enregistre.",
    });
  }

  if (!url || !anon) {
    add({
      level: "fail",
      label: "Supabase",
      detail: "non configuré — pas de compte, pas d'historique, pas de plafond",
      fix: "Renseigne NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (tableau de bord > Project Settings > API).",
    });
    return;
  }

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: anon },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok && response.status !== 404) {
      add({
        level: "fail",
        label: "Supabase — connexion",
        detail: `l'API répond ${response.status}`,
        fix: "Vérifie l'URL du projet et la clé anon.",
      });
      return;
    }
    add({ level: "ok", label: "Supabase — connexion", detail: "le projet répond" });
  } catch (error) {
    add({
      level: "fail",
      label: "Supabase — connexion",
      detail: error instanceof Error ? error.message : "injoignable",
      fix: "Vérifie l'URL du projet et ta connexion réseau.",
    });
    return;
  }

  if (!service) {
    add({
      level: "fail",
      label: "Supabase — clé de service",
      detail: "absente : les audits ne seront pas enregistrés",
      fix: "Renseigne SUPABASE_SERVICE_ROLE_KEY. Ne la préfixe jamais par NEXT_PUBLIC_.",
    });
    return;
  }
  if (service.startsWith("NEXT_PUBLIC") || has("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY")) {
    add({
      level: "fail",
      label: "Supabase — clé de service",
      detail: "exposée au navigateur",
      fix: "Retire tout NEXT_PUBLIC_ devant la clé de service : elle contourne RLS.",
    });
  }

  if (service.startsWith("sb_publishable_")) {
    add({
      level: "fail",
      label: "Supabase — clés interverties",
      detail: "la clé publique est utilisée comme clé de service",
      fix: "SUPABASE_SERVICE_ROLE_KEY doit recevoir la clé secrète (sb_secret_…) : sans elle, rien ne s'enregistre.",
    });
  }

  const head = { apikey: service, Authorization: `Bearer ${service}` };

  // Le schéma est-il appliqué ?
  const tables = ["audits", "audit_engines", "audit_prompts", "purchases", "profiles"];
  const missing: string[] = [];
  for (const table of tables) {
    try {
      const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
        headers: head,
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) missing.push(table);
    } catch {
      missing.push(table);
    }
  }

  if (missing.length) {
    add({
      level: "fail",
      label: "Supabase — schéma",
      detail: `table(s) absente(s) : ${missing.join(", ")}`,
      fix: "Applique supabase/migrations/0001_init.sql (éditeur SQL du tableau de bord, ou `supabase db push`).",
    });
  } else {
    add({ level: "ok", label: "Supabase — schéma", detail: `${tables.length} tables en place` });
  }

  // Le compteur de limite de débit répond-il ?
  try {
    const r = await fetch(`${url}/rest/v1/rpc/consume_rate_limit`, {
      method: "POST",
      headers: { ...head, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_bucket: "doctor",
        p_limit: 1000,
        p_window: "60 seconds",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (r.ok) {
      add({ level: "ok", label: "Limite de débit", detail: "le compteur répond" });
    } else {
      add({
        level: "fail",
        label: "Limite de débit",
        detail: `la fonction consume_rate_limit répond ${r.status}`,
        fix: "Applique la migration : sans cette fonction, aucun plafond n'est appliqué.",
      });
    }
  } catch {
    add({
      level: "fail",
      label: "Limite de débit",
      detail: "fonction injoignable",
      fix: "Applique supabase/migrations/0001_init.sql.",
    });
  }

  // RLS : un client anonyme ne doit rien lire.
  try {
    const r = await fetch(`${url}/rest/v1/audits?select=id&limit=1`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      signal: AbortSignal.timeout(10_000),
    });
    const body = r.ok ? ((await r.json()) as unknown[]) : null;
    if (Array.isArray(body) && body.length > 0) {
      add({
        level: "fail",
        label: "RLS",
        detail: "un visiteur anonyme lit la table audits",
        fix: "Vérifie que RLS est bien actif : `alter table public.audits enable row level security;`",
      });
    } else {
      add({ level: "ok", label: "RLS", detail: "aucune lecture anonyme des audits" });
    }
  } catch {
    add({ level: "warn", label: "RLS", detail: "vérification impossible" });
  }
}

/* --- moteurs de réponse --------------------------------------------------- */

async function ping(
  label: string,
  keyName: string,
  probe: (key: string) => Promise<Response>,
  /** Google répond 400 sur une clé invalide, pas 401. */
  refusedStatuses: number[] = [401, 403],
) {
  const key = env[keyName];
  if (!key) {
    add({
      level: "warn",
      label,
      detail: "pas de clé — le moteur s'affichera « non mesuré »",
      fix: `Renseigne ${keyName} pour l'interroger.`,
    });
    return;
  }
  try {
    const r = await probe(key);
    if (r.ok) {
      add({ level: "ok", label, detail: "clé valide" });
    } else if (refusedStatuses.includes(r.status)) {
      add({
        level: "fail",
        label,
        detail: `clé refusée (${r.status})`,
        fix: `Vérifie ${keyName}.`,
      });
    } else {
      add({ level: "warn", label, detail: `réponse inattendue (${r.status})` });
    }
  } catch (error) {
    add({
      level: "warn",
      label,
      detail: error instanceof Error ? error.message.slice(0, 60) : "injoignable",
    });
  }
}

async function checkEngines() {
  const t = () => AbortSignal.timeout(12_000);
  await ping("ChatGPT", "OPENAI_API_KEY", (key) =>
    fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: t(),
    }),
  );
  await ping("Claude", "ANTHROPIC_API_KEY", (key) =>
    fetch("https://api.anthropic.com/v1/models", {
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
      signal: t(),
    }),
  );
  await ping("Perplexity", "PERPLEXITY_API_KEY", (key) =>
    fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      // Requête minimale : on veut le code d'authentification, pas une réponse.
      body: JSON.stringify({ model: "sonar", messages: [{ role: "user", content: "." }], max_tokens: 1 }),
      signal: t(),
    }),
  );
  await ping(
    "Gemini",
    "GOOGLE_AI_API_KEY",
    (key) =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
        signal: t(),
      }),
    [400, 401, 403],
  );
}

/* --- reste ---------------------------------------------------------------- */

function checkOptional() {
  add(
    has("NEXT_PUBLIC_SITE_URL")
      ? { level: "ok", label: "URL du site", detail: env.NEXT_PUBLIC_SITE_URL }
      : {
          level: "warn",
          label: "URL du site",
          detail: "absente — http://localhost:3000 par défaut",
          fix: "Renseigne NEXT_PUBLIC_SITE_URL en production : les liens de connexion en dépendent.",
        },
  );

  if (!has("STRIPE_SECRET_KEY")) {
    add({ level: "warn", label: "Stripe", detail: "pas branché — les boutons d'achat le disent" });
  } else if (env.STRIPE_SECRET_KEY!.startsWith("pk_")) {
    add({
      level: "fail",
      label: "Stripe",
      detail: "clé publiable utilisée comme clé secrète",
      fix: "STRIPE_SECRET_KEY attend une clé sk_… (Developers > API keys).",
    });
  } else if (!has("STRIPE_WEBHOOK_SECRET")) {
    add({
      level: "fail",
      label: "Stripe — webhook",
      detail: "secret absent : aucun achat ne sera jamais marqué payé",
      fix: "Crée le webhook vers /api/stripe/webhook (événement checkout.session.completed) et copie son secret whsec_… dans STRIPE_WEBHOOK_SECRET.",
    });
  } else {
    add({
      level: env.STRIPE_SECRET_KEY!.startsWith("sk_live_") ? "warn" : "ok",
      label: "Stripe",
      detail: env.STRIPE_SECRET_KEY!.startsWith("sk_live_")
        ? "clé de PRODUCTION : les paiements sont réels"
        : "clé de test, webhook configuré",
    });
  }
  add({
    level: has("RESEND_API_KEY") ? "ok" : "warn",
    label: "E-mails (Resend)",
    detail: has("RESEND_API_KEY") ? "clé présente" : "pas encore branché",
  });
}

/* --- rapport -------------------------------------------------------------- */


async function main() {
  if (!has("NEXT_PUBLIC_SUPABASE_URL") && !has("ANTHROPIC_API_KEY")) {
    console.log(
      "\nAucune configuration détectée. Copie .env.example en .env.local et remplis-le.\n",
    );
  }

  await checkSupabase();
  await checkEngines();
  checkOptional();

  console.log("");
  const mark = (l: Level) => (l === "ok" ? " OK  " : l === "warn" ? " -   " : "ÉCHEC");
  for (const c of checks) {
    console.log(`[${mark(c.level)}] ${c.label.padEnd(24)} ${c.detail}`);
    if (c.fix && c.level !== "ok") console.log(`          ↳ ${c.fix}`);
  }

  const failed = checks.filter((c) => c.level === "fail").length;
  const measured = checks.filter(
    (c) => ["ChatGPT", "Claude", "Perplexity", "Gemini"].includes(c.label) && c.level === "ok",
  ).length;

  console.log("");
  console.log(`Moteurs interrogeables : ${measured} sur 4.`);
  console.log(
    failed === 0
      ? "Rien ne bloque. `npm run dev` et le parcours tourne pour de vrai."
      : `${failed} point${failed > 1 ? "s" : ""} à corriger avant que tout fonctionne.`,
  );
  console.log("");
}

main();
