import { extract } from "./extract";
import { ANSWER_BOTS, isAllowed, parseRobots } from "./robots";

/**
 * L'audit technique vendu avec l'audit GEO.
 *
 * Il ne contient que des faits relevés sur le site à l'instant du scan. Quand
 * une vérification n'a pas pu aboutir, elle sort en `unknown` avec la raison :
 * un rapport payant qui invente un défaut est pire qu'un rapport incomplet.
 */

export type CheckStatus = "ok" | "warn" | "fail" | "unknown";

export type Check = {
  id: string;
  label: string;
  status: CheckStatus;
  /** Ce qui a été observé, pas ce qu'il faudrait faire. */
  note: string;
};

export type SeoScan = {
  url: string;
  reachable: boolean;
  /** Renseigné seulement quand le site n'a pas répondu. */
  failure?: string;
  checks: Check[];
  scannedAt: string;
};

const TIMEOUT_MS = 12_000;
/** Un site peut servir une page de plusieurs mégaoctets : on n'en lit qu'un bout. */
const MAX_BYTES = 1_500_000;
const UA =
  "WieldAudit/1.0 (+https://wield.fr/audit ; audit demandé par le propriétaire du site)";

type Fetched = { status: number; url: string; body: string };

async function get(url: string): Promise<Fetched | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "text/html,text/plain,*/*" },
    });

    const reader = response.body?.getReader();
    if (!reader) {
      return { status: response.status, url: response.url, body: "" };
    }

    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
    await reader.cancel().catch(() => {});

    return {
      status: response.status,
      url: response.url,
      body: new TextDecoder("utf-8", { fatal: false }).decode(
        concat(chunks, Math.min(size, MAX_BYTES)),
      ),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function concat(chunks: Uint8Array[], size: number): Uint8Array {
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    if (offset >= size) break;
    const slice = chunk.subarray(0, size - offset);
    out.set(slice, offset);
    offset += slice.length;
  }
  return out;
}

/** Ramène « exemple.fr », « https://exemple.fr/a » ou « www.exemple.fr » à une origine. */
export function toOrigin(domain: string): string | null {
  const raw = domain.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function scanSite(domain: string): Promise<SeoScan> {
  const scannedAt = new Date().toISOString();
  const origin = toOrigin(domain);

  if (!origin) {
    return {
      url: domain,
      reachable: false,
      failure: "Domaine illisible.",
      checks: [],
      scannedAt,
    };
  }

  const [home, robotsFile, llms] = await Promise.all([
    get(`${origin}/`),
    get(`${origin}/robots.txt`),
    get(`${origin}/llms.txt`),
  ]);

  if (!home || home.status >= 400) {
    return {
      url: origin,
      reachable: false,
      failure: home
        ? `Le site a répondu ${home.status}.`
        : "Le site n'a pas répondu dans les 12 secondes.",
      checks: [],
      scannedAt,
    };
  }

  const page = extract(home.body);
  const checks: Check[] = [];

  /* --- Accès des robots de réponse : le point qui décide de tout le reste. --- */
  const hasRobots = Boolean(
    robotsFile && robotsFile.status < 400 && robotsFile.body.trim(),
  );
  const robots = parseRobots(hasRobots ? robotsFile!.body : "");
  const blocked = hasRobots
    ? ANSWER_BOTS.filter((bot) => !isAllowed(robots, bot.agent, "/"))
    : [];

  checks.push({
    id: "robots-ia",
    label: "Accès des robots des moteurs de réponse",
    status: !hasRobots ? "ok" : blocked.length > 0 ? "fail" : "ok",
    note: !hasRobots
      ? "Pas de robots.txt : tous les robots sont autorisés par défaut."
      : blocked.length > 0
        ? `Bloqués par robots.txt : ${blocked.map((b) => `${b.agent} (${b.label})`).join(", ")}.`
        : `Autorisés : ${ANSWER_BOTS.map((b) => b.agent).join(", ")}.`,
  });

  /* --- Titre --- */
  const titleLength = page.title?.length ?? 0;
  checks.push({
    id: "title",
    label: "Balise title",
    status: !page.title ? "fail" : titleLength < 15 || titleLength > 65 ? "warn" : "ok",
    note: !page.title
      ? "Absente sur la page d'accueil."
      : `${titleLength} caractères — « ${page.title} »${
          titleLength > 65
            ? " (tronquée dans les résultats au-delà de 65)"
            : titleLength < 15
              ? " (trop courte pour porter une promesse)"
              : ""
        }`,
  });

  /* --- Meta description --- */
  const descLength = page.description?.length ?? 0;
  checks.push({
    id: "description",
    label: "Meta description",
    status: !page.description ? "fail" : descLength < 50 || descLength > 160 ? "warn" : "ok",
    note: !page.description
      ? "Absente : le moteur compose lui-même le résumé."
      : `${descLength} caractères${descLength > 160 ? " (coupée au-delà de 160)" : descLength < 50 ? " (trop courte)" : ""}.`,
  });

  /* --- H1 --- */
  checks.push({
    id: "h1",
    label: "Titre H1",
    status: page.h1.length === 1 ? "ok" : page.h1.length === 0 ? "fail" : "warn",
    note:
      page.h1.length === 0
        ? "Aucun H1 : rien n'annonce le sujet de la page."
        : page.h1.length === 1
          ? `Un seul H1 — « ${page.h1[0]} »`
          : `${page.h1.length} H1 sur la même page : le sujet devient ambigu.`,
  });

  /* --- Données structurées --- */
  const useful = page.schemaTypes.filter((t) =>
    ["Organization", "LocalBusiness", "Service", "Product", "FAQPage"].some(
      (want) => t === want || t.endsWith(want),
    ),
  );
  checks.push({
    id: "json-ld",
    label: "Données structurées (JSON-LD)",
    status:
      page.brokenSchema > 0
        ? "fail"
        : useful.length > 0
          ? "ok"
          : page.schemaTypes.length > 0
            ? "warn"
            : "fail",
    note:
      page.brokenSchema > 0
        ? `${page.brokenSchema} bloc${page.brokenSchema > 1 ? "s" : ""} JSON-LD illisible${page.brokenSchema > 1 ? "s" : ""} : ignoré${page.brokenSchema > 1 ? "s" : ""} par les moteurs.`
        : page.schemaTypes.length === 0
          ? "Aucune : ton entreprise n'est pas décrite comme une entité."
          : `Types déclarés : ${page.schemaTypes.join(", ")}.${useful.length === 0 ? " Aucun ne décrit l'entreprise ni son offre." : ""}`,
  });

  /* --- Canonique --- */
  checks.push({
    id: "canonical",
    label: "URL canonique",
    status: page.canonical ? "ok" : "warn",
    note: page.canonical
      ? `Déclarée : ${page.canonical}`
      : "Absente : le même contenu sur deux adresses se concurrence lui-même.",
  });

  /* --- Langue --- */
  checks.push({
    id: "lang",
    label: "Langue déclarée",
    status: page.lang ? "ok" : "warn",
    note: page.lang
      ? `<html lang="${page.lang}">`
      : "Non déclarée sur la balise html.",
  });

  /* --- Contenu lisible sans JavaScript --- */
  checks.push({
    id: "sans-js",
    label: "Contenu lisible sans JavaScript",
    status: page.textLength >= 600 ? "ok" : page.textLength >= 200 ? "warn" : "fail",
    note: `${page.textLength} caractères de texte dans le HTML servi. ${
      page.textLength < 200
        ? "Presque rien : la page se construit dans le navigateur, et plusieurs robots ne l'exécutent pas."
        : page.textLength < 600
          ? "Peu de contenu servi directement."
          : "Le contenu est là avant tout script."
    }`,
  });

  /* --- Sitemap --- */
  const declared = robots.sitemaps.length > 0;
  const sitemap = declared ? null : await get(`${origin}/sitemap.xml`);
  const sitemapFound =
    declared || Boolean(sitemap && sitemap.status < 400 && sitemap.body.includes("<url"));
  checks.push({
    id: "sitemap",
    label: "Sitemap",
    status: sitemapFound ? "ok" : "warn",
    note: declared
      ? `Déclaré dans robots.txt : ${robots.sitemaps.join(", ")}`
      : sitemapFound
        ? "Trouvé sur /sitemap.xml, mais pas déclaré dans robots.txt."
        : "Introuvable sur /sitemap.xml et non déclaré dans robots.txt.",
  });

  /* --- llms.txt : encore jeune, donc jamais compté comme un défaut. --- */
  const hasLlms = Boolean(llms && llms.status < 400 && llms.body.trim());
  checks.push({
    id: "llms",
    label: "Fichier llms.txt",
    status: hasLlms ? "ok" : "warn",
    note: hasLlms
      ? "Présent : tu indiques aux moteurs quoi lire en priorité."
      : "Absent. Convention récente, pas encore suivie par tous les moteurs — un bonus, pas une faute.",
  });

  /* --- HTTPS --- */
  const finalUrl = new URL(home.url || origin);
  checks.push({
    id: "https",
    label: "HTTPS",
    status: finalUrl.protocol === "https:" ? "ok" : "fail",
    note:
      finalUrl.protocol === "https:"
        ? "Servi en HTTPS."
        : "Servi en HTTP : plusieurs robots refusent de suivre.",
  });

  return { url: origin, reachable: true, checks, scannedAt };
}
