/**
 * Lecture du HTML sans dépendance.
 *
 * Une expression régulière ne remplace pas un analyseur, et on ne lui demande
 * pas de le faire : on cherche une poignée de balises précises dans le `head`
 * et les titres. Ce qui est douteux est rendu comme inconnu, jamais comme un
 * défaut : accuser un site à tort est pire que ne rien dire.
 */

export type Extracted = {
  title: string | null;
  description: string | null;
  h1: string[];
  canonical: string | null;
  lang: string | null;
  /** Les `@type` trouvés dans les blocs JSON-LD valides. */
  schemaTypes: string[];
  /** Nombre de blocs JSON-LD illisibles : un balisage cassé n'est pas lu. */
  brokenSchema: number;
  /** Texte visible approximatif, pour repérer les pages vides sans JavaScript. */
  textLength: number;
};

function decode(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function attr(tag: string, name: string): string | null {
  const match = new RegExp(
    `\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`,
    "i",
  ).exec(tag);
  if (!match) return null;
  return decode(match[2] ?? match[3] ?? match[4] ?? "");
}

/** Toutes les balises `<name ...>` du document, brutes. */
function tags(html: string, name: string): string[] {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
}

export function extract(html: string): Extracted {
  const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? html;

  const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1];

  let description: string | null = null;
  for (const tag of tags(head, "meta")) {
    if (attr(tag, "name")?.toLowerCase() === "description") {
      description = attr(tag, "content");
      break;
    }
  }

  let canonical: string | null = null;
  for (const tag of tags(head, "link")) {
    if (attr(tag, "rel")?.toLowerCase() === "canonical") {
      canonical = attr(tag, "href");
      break;
    }
  }

  const h1 = [
    ...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi),
  ].map((m) => decode(m[1].replace(/<[^>]*>/g, " ")));

  const htmlTag = /<html\b[^>]*>/i.exec(html)?.[0];
  const lang = htmlTag ? attr(htmlTag, "lang") : null;

  const { schemaTypes, brokenSchema } = readSchema(html);

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ");

  return {
    title: title ? decode(title) || null : null,
    description: description || null,
    h1,
    canonical: canonical || null,
    lang: lang || null,
    schemaTypes,
    brokenSchema,
    textLength: decode(text).length,
  };
}

function readSchema(html: string): {
  schemaTypes: string[];
  brokenSchema: number;
} {
  const found = new Set<string>();
  let broken = 0;

  const blocks = html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(block[1].trim());
    } catch {
      broken += 1;
      continue;
    }
    collectTypes(parsed, found);
  }

  return { schemaTypes: [...found].sort(), brokenSchema: broken };
}

/** `@graph`, tableaux et objets imbriqués : les trois formes se rencontrent. */
function collectTypes(node: unknown, into: Set<string>, depth = 0): void {
  if (depth > 6 || node === null || typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, into, depth + 1);
    return;
  }

  const record = node as Record<string, unknown>;
  const type = record["@type"];
  if (typeof type === "string") into.add(type);
  else if (Array.isArray(type)) {
    for (const t of type) if (typeof t === "string") into.add(t);
  }

  for (const [key, value] of Object.entries(record)) {
    if (key === "@type") continue;
    collectTypes(value, into, depth + 1);
  }
}
