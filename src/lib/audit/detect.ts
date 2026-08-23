import type { PromptResult, Source } from "./types";

/** Minuscules, sans accents, ponctuation réduite à des espaces. */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** « https://www.exemple.fr/page » -> « exemple.fr » */
export function toDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.replace(/^www\./, "").toLowerCase();
  }
}

/**
 * La marque est-elle citée ?
 *
 * Deux signaux, par ordre de fiabilité :
 *   1. le domaine apparaît dans les sources — c'est une citation au sens strict,
 *      celle qui ramène du trafic ;
 *   2. le nom de la marque apparaît dans le texte de la réponse — une mention,
 *      qui compte aussi mais qu'on distingue.
 *
 * Le nom seul est ambigu (« Menuiserie du Rhône » est un nom commun assemblé) :
 * on exige donc au moins deux mots significatifs, ou une correspondance exacte
 * du domaine. Sans domaine ni marque, on ne conclut rien.
 */
export function detectCitation(
  answer: { text: string; sources: Source[] },
  brand?: string,
  domain?: string,
): Pick<PromptResult, "cited" | "position" | "winners"> {
  const winners = dedupe(answer.sources.map((s) => s.domain));

  const target = domain ? toDomain(domain) : undefined;
  if (target) {
    const index = answer.sources.findIndex(
      (s) => s.domain === target || s.domain.endsWith(`.${target}`),
    );
    if (index >= 0) {
      return {
        cited: true,
        position: index + 1,
        winners: winners.filter((d) => d !== answer.sources[index].domain),
      };
    }
  }

  if (brand) {
    const needle = normalize(brand);
    const words = needle.split(" ").filter((w) => w.length > 2);
    const haystack = normalize(answer.text);
    const mentioned =
      words.length >= 2
        ? haystack.includes(needle)
        : Boolean(needle) && new RegExp(`\\b${escape(needle)}\\b`).test(haystack);
    if (mentioned) {
      return { cited: true, position: null, winners };
    }
  }

  return { cited: false, position: null, winners };
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
