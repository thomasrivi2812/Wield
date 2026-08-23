/**
 * Diagnostic d'installation.
 *
 * Répond à une seule question : qu'est-ce qui manque pour que le site tourne
 * pour de vrai ? Chaque ligne dit ce qui va, ce qui ne va pas, et quoi faire.
 * Aucun test ne coûte d'argent : on n'interroge que des endpoints gratuits.
 *
 *   npm run doctor                       lit .env.local
 *   npm run doctor -- https://ton-site   interroge le déploiement
 *
 * La seconde forme existe parce que les variables vivent souvent chez
 * l'hébergeur et pas sur la machine : sans elle, le diagnostic local dit que
 * tout manque alors que le site en ligne fonctionne.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REQUIREMENTS, findMisnamed, findMissingPrefix } from "../src/lib/env-names";

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
        // On conserve les valeurs vides : « variable absente » et « variable
        // vide » n'ont pas le même sens pour NEXT_PUBLIC_AUTH_PROVIDERS, et
        // le diagnostic doit refléter ce que l'application voit.
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (!(match[1] in out)) out[match[1]] = value;
      }
    } catch {
      // fichier absent : ce n'est pas une erreur, on le signale plus bas
    }
  }
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined && !(k in out)) out[k] = v;
  }
  return out;
}

const env = loadEnv();
const has = (name: string) => Boolean(env[name]?.trim());

/* --- Supabase ------------------------------------------------------------- */

/** Un nom presque juste est pire qu'un nom absent : on le dit en premier. */
function checkNames(present: Set<string>) {
  const wrong = [...findMisnamed(present), ...findMissingPrefix(present)];
  for (const { found, expected } of wrong) {
    add({
      level: "fail",
      label: "Nom de variable",
      detail: `${found} n'est pas lue`,
      fix: `Renomme-la en ${expected}.`,
    });
  }

  const missing = REQUIREMENTS.filter((r) => r.required && !present.has(r.name));
  for (const r of missing) {
    add({
      level: "fail",
      label: "Variable requise",
      detail: `${r.name} absente`,
      fix: `Sans elle : ${r.unlocks}.`,
    });
  }
}

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

  // La seconde migration est-elle passée ? Sans ces colonnes, l'audit tourne
  // mais le scan technique et le rejeu sont impossibles — et le message
  // d'erreur, lui, est incompréhensible.
  if (!missing.length) {
    try {
      const r = await fetch(
        `${url}/rest/v1/audits?select=domain,brand,seo_scan,seo_scanned_at&limit=0`,
        { headers: head, signal: AbortSignal.timeout(10_000) },
      );
      if (r.ok) {
        add({ level: "ok", label: "Supabase — schéma (2/2)", detail: "colonnes du scan technique en place" });
      } else {
        add({
          level: "fail",
          label: "Supabase — schéma (2/2)",
          detail: "colonnes domain / seo_scan absentes de la table audits",
          fix: "Applique supabase/migrations/0002_audit_seo.sql dans l'éditeur SQL.",
        });
      }
    } catch {
      add({ level: "warn", label: "Supabase — schéma (2/2)", detail: "vérification impossible" });
    }
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

  // Les réglages d'authentification, tels que Supabase les applique vraiment.
  // C'est la seule façon de voir depuis l'extérieur qu'un fournisseur déclaré
  // dans NEXT_PUBLIC_AUTH_PROVIDERS n'est pas activé côté Supabase — le cas
  // qui donne un bouton menant à une erreur.
  try {
    const r = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anon },
      signal: AbortSignal.timeout(10_000),
    });

    if (r.ok) {
      const settings = (await r.json()) as {
        disable_signup?: boolean;
        external?: Record<string, boolean>;
      };

      if (settings.disable_signup) {
        add({
          level: "fail",
          label: "Inscription",
          detail: "la création de compte est désactivée",
          fix: "Supabase → Authentication → Sign In / Providers → active « Allow new users to sign up ». Sans ça, le lien e-mail échoue pour toute nouvelle adresse.",
        });
      } else {
        add({ level: "ok", label: "Inscription", detail: "création de compte autorisée" });
      }

      const declared = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "google")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const inactive = declared.filter((p) => settings.external?.[p] !== true);

      if (inactive.length) {
        add({
          level: "fail",
          label: "Fournisseurs de connexion",
          detail: `déclaré(s) dans l'application mais pas activé(s) dans Supabase : ${inactive.join(", ")}`,
          fix: "Supabase → Authentication → Providers : active-les, ou retire-les de NEXT_PUBLIC_AUTH_PROVIDERS. Un bouton qui mène à une erreur fait croire que le site est cassé.",
        });
      } else if (declared.length) {
        add({
          level: "ok",
          label: "Fournisseurs de connexion",
          detail: `${declared.join(", ")} — activé(s) des deux côtés`,
        });
      }
    } else {
      add({ level: "warn", label: "Réglages d'authentification", detail: `réponse ${r.status}` });
    }
  } catch {
    add({ level: "warn", label: "Réglages d'authentification", detail: "vérification impossible" });
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
    } else {
      // Le corps de la réponse dit ce qui cloche — quota épuisé, modèle
      // inaccessible, facturation non activée. « refusé (401) » ne le dit pas.
      const raison = await providerMessage(r);
      const refuse = refusedStatuses.includes(r.status);
      add({
        level: refuse ? "fail" : "warn",
        label,
        detail: `${refuse ? "clé refusée" : "réponse inattendue"} (${r.status})${raison ? ` — ${raison}` : ""}`,
        fix: refuse ? `Vérifie ${keyName}.` : undefined,
      });
    }
  } catch (error) {
    add({
      level: "warn",
      label,
      detail: error instanceof Error ? error.message.slice(0, 60) : "injoignable",
    });
  }
}

/** Le message d'erreur du fournisseur, quel que soit son emballage JSON. */
async function providerMessage(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as Record<string, unknown>;
    const error = (body.error ?? body) as Record<string, unknown>;
    const message = error.message ?? error.detail ?? error.type;
    return typeof message === "string" ? message.slice(0, 160) : null;
  } catch {
    return null;
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
  const rawProviders = env.NEXT_PUBLIC_AUTH_PROVIDERS;
  const known = ["google", "azure", "apple", "linkedin_oidc", "github"];
  if (rawProviders === undefined) {
    add({
      level: "warn",
      label: "Connexion",
      detail: "google seul (valeur par défaut) + lien e-mail",
      fix: "Renseigne NEXT_PUBLIC_AUTH_PROVIDERS pour en proposer d'autres.",
    });
  } else {
    const listed = rawProviders
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
    const unknown = listed.filter((p) => !known.includes(p));
    if (unknown.length) {
      add({
        level: "fail",
        label: "Connexion",
        detail: `fournisseur inconnu : ${unknown.join(", ")}`,
        fix: `Valeurs acceptées : ${known.join(", ")}.`,
      });
    }
    const valid = listed.filter((p) => known.includes(p));
    add({
      level: valid.length ? "ok" : "warn",
      label: "Connexion",
      detail: valid.length
        ? `${valid.join(", ")} + lien e-mail`
        : "lien e-mail uniquement",
    });
  }

  add({
    level: has("RESEND_API_KEY") ? "ok" : "warn",
    label: "E-mails (Resend)",
    detail: has("RESEND_API_KEY") ? "clé présente" : "pas encore branché",
  });
}

/* --- rapport -------------------------------------------------------------- */


/** Interroge /api/sante d'un déploiement et rend le même rapport. */
async function remote(target: string): Promise<boolean> {
  const base = target.replace(/\/+$/, "");
  const token = env.DIAGNOSTIC_TOKEN;
  const url = `${base}/api/sante${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  let payload: Record<string, never>;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (response.status === 404) {
      console.log(
        `\nLe diagnostic distant est désactivé : ajoute DIAGNOSTIC_TOKEN aux variables du déploiement, puis la même valeur dans ton .env.local.\n`,
      );
      return false;
    }
    if (response.status === 401) {
      console.log("\nJeton refusé : DIAGNOSTIC_TOKEN local et distant diffèrent.\n");
      return false;
    }
    if (!response.ok) {
      console.log(`\n${base} répond ${response.status}.\n`);
      return false;
    }
    payload = await response.json();
  } catch (error) {
    console.log(
      `\nImpossible de joindre ${base} : ${error instanceof Error ? error.message : "erreur"}\n`,
    );
    return false;
  }

  const vars = payload["variables"] as
    | { malNommees?: { trouve: string; attendu: string }[]; manquantes?: { nom: string; requise: boolean; debloque: string }[] }
    | undefined;

  for (const m of vars?.malNommees ?? []) {
    add({
      level: "fail",
      label: "Nom de variable",
      detail: `${m.trouve} n'est pas lue`,
      fix: `Renomme-la en ${m.attendu} chez l'hébergeur, puis redéploie.`,
    });
  }
  for (const m of (vars?.manquantes ?? []).filter((x) => x.requise)) {
    add({
      level: "fail",
      label: "Variable requise",
      detail: `${m.nom} absente`,
      fix: `Sans elle : ${m.debloque}.`,
    });
  }

  const sb = payload["supabase"] as Record<string, never>;
  const moteurs = payload["moteurs"] as Record<string, boolean>;
  const co = payload["connexion"] as Record<string, never>;
  const st = payload["stripe"] as Record<string, never>;

  add(
    payload["siteUrl"]
      ? { level: "ok", label: "URL du site", detail: String(payload["siteUrl"]) }
      : { level: "fail", label: "URL du site", detail: "NEXT_PUBLIC_SITE_URL absente", fix: "Les liens de connexion et les retours Stripe en dépendent." },
  );

  if (!sb?.["configure"]) {
    add({ level: "fail", label: "Supabase", detail: "non configuré", fix: "Ajoute les variables Supabase au déploiement." });
  } else if (!sb["cleDeService"]) {
    add({ level: "fail", label: "Supabase", detail: "clé de service absente", fix: "SUPABASE_SERVICE_ROLE_KEY manque : rien ne sera enregistré." });
  } else {
    const manquantes = (sb["tablesManquantes"] ?? []) as string[];
    add(
      manquantes.length
        ? { level: "fail", label: "Supabase — schéma", detail: `table(s) absente(s) : ${manquantes.join(", ")}`, fix: "Applique supabase/migrations/0001_init.sql dans l'éditeur SQL." }
        : { level: "ok", label: "Supabase — schéma", detail: `${((sb["tables"] ?? []) as string[]).length} tables en place` },
    );
    add(
      sb["compteur"]
        ? { level: "ok", label: "Limite de débit", detail: "le compteur répond" }
        : { level: "fail", label: "Limite de débit", detail: "fonction absente", fix: "Applique la migration : sans elle, aucun plafond." },
    );
  }

  const fournisseurs = (co?.["fournisseurs"] ?? []) as string[];
  add({
    level: fournisseurs.length ? "ok" : "warn",
    label: "Connexion",
    detail: fournisseurs.length ? `${fournisseurs.join(", ")} + lien e-mail` : "lien e-mail uniquement",
  });

  for (const [id, label] of [["chatgpt", "ChatGPT"], ["claude", "Claude"], ["perplexity", "Perplexity"], ["gemini", "Gemini"]] as const) {
    const etat = moteurs?.[id] as
      | {
          cle?: boolean;
          actif?: boolean;
          derniereErreur?: string | null;
          quand?: string | null;
        }
      | boolean
      | undefined;

    // L'ancien format renvoyait un simple booléen ; on reste lisible face aux
    // deux, le temps que le déploiement rattrape.
    const cle = typeof etat === "boolean" ? etat : Boolean(etat?.cle);
    const erreur = typeof etat === "object" ? (etat?.derniereErreur ?? null) : null;
    const quand = typeof etat === "object" ? (etat?.quand ?? null) : null;

    const actif = typeof etat === "object" ? etat?.actif !== false : true;

    if (!actif) {
      add({
        level: "warn",
        label,
        detail: "coupé volontairement (AUDIT_ENGINES)",
        fix: "Retire-le d'AUDIT_ENGINES pour le réactiver, ou supprime la variable pour les quatre.",
      });
    } else if (!cle) {
      add({ level: "warn", label, detail: "pas de clé — « non mesuré »" });
    } else if (erreur) {
      add({
        level: "fail",
        label,
        detail: `dernier audit en erreur — ${erreur.slice(0, 140)}`,
        fix: quand
          ? `Relevé le ${new Date(quand).toLocaleString("fr-FR")}. Message renvoyé par le fournisseur, tel quel.`
          : "Message renvoyé par le fournisseur, tel quel.",
      });
    } else {
      add({ level: "ok", label, detail: "clé présente, aucune erreur récente" });
    }
  }

  const couts = payload["couts"] as Record<string, number | string> | undefined;
  if (couts) {
    if (!couts["chiffres"]) {
      add({
        level: "warn",
        label: "Coût par audit",
        detail: "aucun audit chiffré",
        fix: "Renseigne les tarifs des moteurs (PRICE_OPENAI_INPUT, PRICE_GOOGLE_INPUT, …) pour que le coût se calcule. Sans eux, tu vends au jugé.",
      });
    } else {
      add({
        level: "ok",
        label: "Coût par audit",
        detail: `moyenne ${couts["moyenUsd"]} $ · pire cas ${couts["maxUsd"]} $ (sur ${couts["chiffres"]} audits chiffrés)`,
      });
    }
  }

  if (!st?.["cle"]) {
    add({ level: "warn", label: "Stripe", detail: "pas branché" });
  } else if (!st["webhook"]) {
    add({ level: "fail", label: "Stripe — webhook", detail: "secret absent : aucun achat marqué payé", fix: "Crée le webhook vers /api/stripe/webhook." });
  } else {
    add({ level: st["mode"] === "production" ? "warn" : "ok", label: "Stripe", detail: st["mode"] === "production" ? "clé de PRODUCTION" : "mode test, webhook configuré" });
  }

  add({
    level: (payload["email"] as Record<string, boolean>)?.["resend"] ? "ok" : "warn",
    label: "E-mails (Resend)",
    detail: (payload["email"] as Record<string, boolean>)?.["resend"] ? "clé présente" : "pas encore branché",
  });

  return true;
}

async function main() {
  const target = process.argv[2];
  if (target?.startsWith("http")) {
    console.log(`\nDiagnostic de ${target}`);
    // Sans données, il ne faut surtout pas conclure : un rapport vide se lit
    // « rien ne bloque », exactement l'inverse de la vérité.
    if (await remote(target)) report();
    return;
  }

  if (!has("NEXT_PUBLIC_SUPABASE_URL") && !has("ANTHROPIC_API_KEY")) {
    console.log(
      "\nAucune configuration détectée. Copie .env.example en .env.local et remplis-le.\n",
    );
  }

  checkNames(new Set(Object.keys(env)));
  await checkSupabase();
  await checkEngines();
  checkOptional();
  report();
}

function report() {
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
