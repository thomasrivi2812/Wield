/**
 * Le plan d'action, déduit des constats réels de l'audit.
 *
 * Règle unique et non négociable : chaque action porte le constat mesuré qui
 * la justifie. Pas de constat, pas d'action. C'est ce qui sépare un rapport
 * vendu 4,99 € d'un texte générique qu'on aurait pu écrire avant de lancer
 * l'audit — et c'est la seule raison pour laquelle il vaut son prix.
 */

export type Priority = "haute" | "moyenne";

export type Action = {
  priority: Priority;
  title: string;
  body: string;
  /** Le fait observé pendant l'audit. Jamais une généralité. */
  evidence: string;
};

export type PlanPrompt = {
  prompt: string;
  engine: string;
  cited: boolean;
  position: number | null;
  winners: string[];
};

export type PlanEngine = {
  engine: string;
  label: string;
  status: string;
};

export type PlanInput = {
  query: string;
  brand?: string | null;
  citedCount: number;
  measuredCount: number;
  engines: PlanEngine[];
  prompts: PlanPrompt[];
};

/**
 * Domaines qui agrègent l'offre au lieu de la produire. Quand ils captent les
 * réponses, le problème n'est pas la qualité du site : c'est que le moteur ne
 * trouve aucune source de première main. Le conseil diffère radicalement.
 */
const AGGREGATORS = [
  "pagesjaunes.fr",
  "societe.com",
  "verif.com",
  "infogreffe.fr",
  "kompass.com",
  "europages.fr",
  "leboncoin.fr",
  "trustpilot.com",
  "wikipedia.org",
  "linkedin.com",
  "facebook.com",
  "yelp.com",
  "houzz.fr",
  "travaux.com",
  "quotatis.fr",
  "starofservice.com",
  "annuaire-entreprises.data.gouv.fr",
];

function isAggregator(domain: string): boolean {
  const clean = domain.toLowerCase().replace(/^www\./, "");
  return AGGREGATORS.some(
    (known) => clean === known || clean.endsWith(`.${known}`),
  );
}

/** Domaines cités à ta place, du plus fréquent au moins fréquent. */
export function rankWinners(
  prompts: PlanPrompt[],
): Array<{ domain: string; count: number }> {
  const tally = new Map<string, number>();

  for (const prompt of prompts) {
    // Un domaine cité trois fois dans la même réponse reste une occurrence :
    // sinon un moteur bavard écraserait le classement à lui seul.
    for (const domain of new Set(prompt.winners.map(normalise))) {
      if (!domain) continue;
      tally.set(domain, (tally.get(domain) ?? 0) + 1);
    }
  }

  return [...tally.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
}

function normalise(domain: string): string {
  return domain.trim().toLowerCase().replace(/^www\./, "");
}

function enumerate(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

/**
 * Construit le plan. Renvoie une liste vide quand rien n'a été mesuré : on ne
 * fabrique pas de recommandations sur du vide, et l'appelant refuse alors la
 * vente.
 */
export function buildPlan(input: PlanInput): Action[] {
  if (input.measuredCount === 0) return [];

  const actions: Action[] = [];
  const { prompts, query } = input;
  const answered = prompts.length;
  const citedPrompts = prompts.filter((p) => p.cited);
  const missed = prompts.filter((p) => !p.cited);
  const winners = rankWinners(prompts);
  const top = winners.slice(0, 3);

  /* 1. Le constat de fond : présent ou absent en tant qu'entité. */
  if (input.citedCount === 0) {
    actions.push({
      priority: "haute",
      title: "Publier une page qui répond à la question, pas une page qui se présente",
      body:
        `Aucun moteur ne te ramène sur « ${query} ». Les moteurs de réponse citent des pages qui répondent, ` +
        `pas des plaquettes. Écris une page par question ci-dessus : la réponse en première ligne, ` +
        `les faits vérifiables ensuite (chiffres, délais, zone couverte, références nommées).`,
      evidence: `0 citation sur ${input.measuredCount} moteur${input.measuredCount > 1 ? "s" : ""} interrogé${input.measuredCount > 1 ? "s" : ""}.`,
    });
  } else if (answered > 0) {
    const rate = Math.round((citedPrompts.length / answered) * 100);
    actions.push({
      priority: citedPrompts.length * 2 < answered ? "haute" : "moyenne",
      title: "Couvrir les questions où tu disparais",
      body:
        `Tu ressors sur une partie des questions seulement. Reprends celles où tu es absent : ` +
        `ce sont des sujets sur lesquels un client te cherche et tombe sur quelqu'un d'autre. ` +
        `Une page dédiée par question manquante, avec la réponse en tête.`,
      evidence: `Cité sur ${citedPrompts.length} réponse${citedPrompts.length > 1 ? "s" : ""} sur ${answered} (${rate} %).`,
    });
  }

  /* 2. Qui occupe la place, et ce que ça implique. */
  if (top.length > 0) {
    const aggregators = top.filter((w) => isAggregator(w.domain));
    const direct = top.filter((w) => !isAggregator(w.domain));

    if (aggregators.length >= direct.length && aggregators.length > 0) {
      actions.push({
        priority: "haute",
        title: "Reprendre la main sur les annuaires",
        body:
          `Les moteurs se rabattent sur des agrégateurs, ce qui veut dire qu'ils ne trouvent pas ` +
          `de source directe crédible sur ton métier. Deux choses en parallèle : compléter et ` +
          `harmoniser tes fiches sur ${enumerate(aggregators.map((a) => a.domain))} (même raison sociale, ` +
          `même adresse, même description), et publier sur ton propre site la page de référence ` +
          `qu'ils citent à ta place.`,
        evidence: `${enumerate(aggregators.map((a) => `${a.domain} (${a.count}×)`))} parmi les sources les plus citées.`,
      });
    }

    if (direct.length > 0) {
      actions.push({
        priority: "moyenne",
        title: "Regarder ce que publient les sites qui sortent devant toi",
        body:
          `Ces domaines sont cités sur tes questions. Ouvre leurs pages : ce qui les rend citables ` +
          `est presque toujours visible à l'œil nu — une réponse directe en haut de page, des chiffres ` +
          `datés, des cas nommés, une FAQ. Ce n'est pas un travail de rédaction, c'est un travail de preuve.`,
        evidence: `${enumerate(direct.map((d) => `${d.domain} (${d.count}×)`))} cité${direct.length > 1 ? "s" : ""} à ta place.`,
      });
    }
  }

  /* 3. Cité, mais trop loin pour compter. */
  const positions = citedPrompts
    .map((p) => p.position)
    .filter((p): p is number => typeof p === "number" && p > 0);

  if (positions.length > 0) {
    const best = Math.min(...positions);
    if (best > 3) {
      actions.push({
        priority: "moyenne",
        title: "Remonter dans les sources citées",
        body:
          `Tu es cité, mais jamais dans les premières sources. Un assistant nomme deux ou trois ` +
          `acteurs, rarement plus : au-delà, être cité ne se transforme pas en appel. ` +
          `Les sources qui remontent sont celles qui répondent le plus directement à la question posée.`,
        evidence: `Meilleure position observée : ${best}ᵉ source.`,
      });
    }
  }

  /* 4. Écart entre moteurs : un moteur muet est un signal, pas une fatalité. */
  const measured = input.engines.filter(
    (e) => e.status === "cited" || e.status === "absent",
  );
  const silent = measured.filter((e) => e.status === "absent");

  if (silent.length > 0 && silent.length < measured.length) {
    actions.push({
      priority: "moyenne",
      title: `Traiter le cas ${enumerate(silent.map((e) => e.label))}`,
      body:
        `Certains moteurs te citent, ${enumerate(silent.map((e) => e.label))} non. ` +
        `L'écart vient rarement du contenu : il vient de l'accès. Vérifie que ton robots.txt ne ` +
        `bloque pas leurs robots, et que tes pages clés sont lisibles sans JavaScript — ` +
        `plusieurs moteurs n'exécutent pas le script.`,
      evidence: `${enumerate(silent.map((e) => e.label))} : aucune mention sur les ${answered > 0 ? Math.round(answered / Math.max(measured.length, 1)) : 0} questions posées.`,
    });
  }

  /* 5. Les questions manquées, nommées. C'est le plan de contenu. */
  if (missed.length > 0) {
    const unique = [...new Set(missed.map((p) => p.prompt))].slice(0, 6);
    actions.push({
      priority: "moyenne",
      title: "Ton plan de contenu, déjà écrit",
      body:
        `Ces formulations sont celles auxquelles les moteurs ont répondu sans toi. ` +
        `Prends-les telles quelles comme titres de page :\n` +
        unique.map((p) => `— ${p}`).join("\n"),
      evidence: `${unique.length} question${unique.length > 1 ? "s" : ""} sans citation de ta part.`,
    });
  }

  return actions;
}
