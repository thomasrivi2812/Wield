/**
 * Lecture de robots.txt.
 *
 * On affirme à l'écran « ChatGPT n'a pas le droit de lire ton site ». C'est
 * une accusation précise, donc elle doit être juste : on applique les vraies
 * règles du protocole — groupes d'agents, correspondance la plus longue,
 * Allow qui l'emporte à longueur égale — et pas un `includes("GPTBot")`.
 */

export type Rule = { allow: boolean; path: string };
export type Group = { agents: string[]; rules: Rule[] };

export type Robots = {
  groups: Group[];
  sitemaps: string[];
};

export function parseRobots(text: string): Robots {
  const groups: Group[] = [];
  const sitemaps: string[] = [];

  let current: Group | null = null;
  // Plusieurs User-agent qui se suivent partagent le même bloc de règles.
  let openForAgents = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;

    const colon = line.indexOf(":");
    if (colon === -1) continue;

    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (field === "sitemap") {
      if (value) sitemaps.push(value);
      continue;
    }

    if (field === "user-agent") {
      if (!current || !openForAgents) {
        current = { agents: [], rules: [] };
        groups.push(current);
        openForAgents = true;
      }
      current.agents.push(value.toLowerCase());
      continue;
    }

    if (field === "allow" || field === "disallow") {
      if (!current) continue;
      openForAgents = false;
      // `Disallow:` vide autorise tout : c'est l'inverse de `Disallow: /`.
      if (field === "disallow" && value === "") {
        current.rules.push({ allow: true, path: "/" });
      } else if (value) {
        current.rules.push({ allow: field === "allow", path: value });
      }
    }
  }

  return { groups, sitemaps };
}

/** Le groupe qui s'applique à cet agent : nom exact d'abord, `*` en secours. */
function groupFor(robots: Robots, agent: string): Group | null {
  const wanted = agent.toLowerCase();
  const exact = robots.groups.filter((g) =>
    g.agents.some((a) => a === wanted),
  );
  if (exact.length > 0) return merge(exact);

  const star = robots.groups.filter((g) => g.agents.includes("*"));
  return star.length > 0 ? merge(star) : null;
}

function merge(groups: Group[]): Group {
  return {
    agents: groups.flatMap((g) => g.agents),
    rules: groups.flatMap((g) => g.rules),
  };
}

function matches(path: string, pattern: string): number | null {
  // Le protocole accepte `*` et `$` ; les ignorer ferait dire au rapport
  // l'inverse de la réalité sur un `Disallow: /*.pdf$`.
  if (pattern.includes("*") || pattern.endsWith("$")) {
    const source =
      "^" +
      pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")
        .replace(/\\\$$/, "$");
    try {
      return new RegExp(source).test(path) ? pattern.length : null;
    } catch {
      return null;
    }
  }
  return path.startsWith(pattern) ? pattern.length : null;
}

/** Cet agent a-t-il le droit de lire ce chemin ? Sans règle, oui. */
export function isAllowed(
  robots: Robots,
  agent: string,
  path = "/",
): boolean {
  const group = groupFor(robots, agent);
  if (!group || group.rules.length === 0) return true;

  let best: Rule | null = null;
  let bestLength = -1;

  for (const rule of group.rules) {
    const length = matches(path, rule.path);
    if (length === null) continue;
    // À longueur égale, Allow gagne : c'est la règle de départage du protocole.
    if (length > bestLength || (length === bestLength && rule.allow)) {
      best = rule;
      bestLength = length;
    }
  }

  return best ? best.allow : true;
}

/**
 * Les robots qui alimentent les moteurs de réponse.
 * Le nom exact compte : « ChatGPT-User » et « GPTBot » ne font pas le même
 * travail, et bloquer l'un sans l'autre n'a pas les mêmes conséquences.
 */
export const ANSWER_BOTS = [
  { agent: "GPTBot", label: "ChatGPT (index)" },
  { agent: "OAI-SearchBot", label: "ChatGPT (recherche)" },
  { agent: "ClaudeBot", label: "Claude" },
  { agent: "PerplexityBot", label: "Perplexity" },
  { agent: "Google-Extended", label: "Gemini" },
] as const;
