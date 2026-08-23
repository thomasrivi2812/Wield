import type { EngineId, EngineResult, Usage } from "./types";

/**
 * Ce que coûte un audit.
 *
 * Deux natures d'information, à ne jamais mélanger :
 *
 * 1. Les **jetons consommés** sont mesurés. Les quatre SDK les renvoient, on
 *    les additionne, c'est exact.
 * 2. Les **tarifs** ne le sont pas tous. Perplexity facture dans sa réponse :
 *    on prend son chiffre tel quel. Pour les autres, le tarif vient de la
 *    table ci-dessous ou d'une variable d'environnement — et quand il est
 *    absent, le coût vaut `null`.
 *
 * `null` n'est pas « zéro ». Un audit dont le coût est inconnu doit se lire
 * « non chiffré », jamais « gratuit » : c'est sur ce chiffre qu'on fixe un
 * prix de vente.
 */

export type Price = {
  /** Dollars par million de jetons d'entrée. */
  inputPerMTok: number | null;
  outputPerMTok: number | null;
  /** Dollars par recherche web côté serveur, quand elle est facturée à part. */
  perSearch: number | null;
  /** D'où vient ce tarif, et à quelle date il a été relevé. */
  source: string;
};

/** Lit un tarif surchargé par l'environnement. */
function override(name: string): number | null {
  const raw = process.env[name];
  if (!raw) return null;
  const value = Number(raw.trim());
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Les tarifs par défaut.
 *
 * Seul celui d'Anthropic est renseigné ici : c'est le seul que j'aie pu
 * vérifier contre une source de référence. Les trois autres restent vides
 * volontairement — un prix inventé qui sert à fixer un prix de vente est pire
 * qu'un prix manquant. Renseigne-les avec les variables ci-dessous après
 * avoir lu la page tarifaire du fournisseur.
 */
export function priceFor(engine: EngineId): Price {
  switch (engine) {
    case "claude":
      return {
        inputPerMTok: override("PRICE_ANTHROPIC_INPUT") ?? 5,
        outputPerMTok: override("PRICE_ANTHROPIC_OUTPUT") ?? 25,
        // La recherche web est facturée à l'unité, à un tarif que je n'ai pas
        // vérifié : à renseigner, sinon elle n'entre pas dans le total.
        perSearch: override("PRICE_ANTHROPIC_SEARCH"),
        source: "tarif Claude Opus 5 relevé le 2026-06-24 (5 $ / 25 $ par MTok)",
      };
    case "chatgpt":
      return {
        inputPerMTok: override("PRICE_OPENAI_INPUT"),
        outputPerMTok: override("PRICE_OPENAI_OUTPUT"),
        perSearch: override("PRICE_OPENAI_SEARCH"),
        source: "à renseigner : PRICE_OPENAI_INPUT / _OUTPUT / _SEARCH",
      };
    case "gemini":
      return {
        inputPerMTok: override("PRICE_GOOGLE_INPUT"),
        outputPerMTok: override("PRICE_GOOGLE_OUTPUT"),
        perSearch: override("PRICE_GOOGLE_SEARCH"),
        source: "à renseigner : PRICE_GOOGLE_INPUT / _OUTPUT / _SEARCH",
      };
    case "perplexity":
      return {
        inputPerMTok: override("PRICE_PERPLEXITY_INPUT"),
        outputPerMTok: override("PRICE_PERPLEXITY_OUTPUT"),
        perSearch: override("PRICE_PERPLEXITY_SEARCH"),
        source: "facturé par le fournisseur dans sa réponse",
      };
  }
}

export const EMPTY_USAGE: Usage = {
  inputTokens: 0,
  outputTokens: 0,
  searches: 0,
  billedUsd: null,
};

/** Additionne la consommation de plusieurs réponses. */
export function sumUsage(parts: Array<Usage | undefined>): Usage {
  let billed: number | null = null;

  const total = parts.reduce<Usage>((acc, part) => {
    if (!part) return acc;
    if (part.billedUsd !== null) billed = (billed ?? 0) + part.billedUsd;
    return {
      inputTokens: acc.inputTokens + part.inputTokens,
      outputTokens: acc.outputTokens + part.outputTokens,
      searches: acc.searches + part.searches,
      billedUsd: null,
    };
  }, EMPTY_USAGE);

  return { ...total, billedUsd: billed };
}

/**
 * Le coût d'un moteur. `null` quand aucun tarif n'est connu — jamais 0.
 * Un tarif partiel (entrée connue, sortie inconnue) est traité comme inconnu :
 * un total amputé de la moitié la plus chère induirait en erreur.
 */
export function costOf(engine: EngineId, usage: Usage | undefined): number | null {
  if (!usage) return null;
  if (usage.billedUsd !== null) return usage.billedUsd;

  const price = priceFor(engine);
  if (price.inputPerMTok === null || price.outputPerMTok === null) return null;

  const tokens =
    (usage.inputTokens / 1_000_000) * price.inputPerMTok +
    (usage.outputTokens / 1_000_000) * price.outputPerMTok;

  const searches =
    price.perSearch === null ? 0 : usage.searches * price.perSearch;

  return tokens + searches;
}

export type AuditCost = {
  /** Somme des moteurs chiffrables. Null si aucun ne l'est. */
  totalUsd: number | null;
  /** Moteurs interrogés dont on ne sait pas chiffrer la consommation. */
  unpricedEngines: EngineId[];
  perEngine: Array<{
    engine: EngineId;
    usage: Usage;
    costUsd: number | null;
  }>;
};

export function auditCost(engines: EngineResult[]): AuditCost {
  const perEngine: AuditCost["perEngine"] = [];
  const unpriced: EngineId[] = [];
  let total: number | null = null;

  for (const engine of engines) {
    // Un moteur non interrogé n'a rien coûté : il n'entre pas dans le calcul
    // et ne compte pas comme « non chiffré ».
    if (!engine.usage) continue;

    const cost = costOf(engine.engine, engine.usage);
    perEngine.push({ engine: engine.engine, usage: engine.usage, costUsd: cost });

    if (cost === null) unpriced.push(engine.engine);
    else total = (total ?? 0) + cost;
  }

  return { totalUsd: total, unpricedEngines: unpriced, perEngine };
}

/** « 0,412 $ » — trois décimales, parce qu'un audit coûte des centimes. */
export function formatUsd(value: number | null): string {
  if (value === null) return "non chiffré";
  return `${value.toFixed(3).replace(".", ",")} $`;
}
