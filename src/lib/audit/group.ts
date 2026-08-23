import type { StoredPrompt } from "./store";

/**
 * Le détail est stocké à plat : une ligne par couple (moteur, question).
 * À l'écran, c'est la question qui intéresse le lecteur — « sur celle-ci,
 * qui sort, et est-ce que je suis dedans ? ». On regroupe donc par question,
 * en gardant qui a répondu quoi.
 */

export type GroupedPrompt = {
  prompt: string;
  /** Moteurs qui te citent sur cette question. */
  citedBy: string[];
  /** Moteurs interrogés sur cette question qui ne te citent pas. */
  absentFrom: string[];
  /** Domaines cités à ta place, sans doublon, dans l'ordre d'apparition. */
  winners: string[];
  /** Meilleure position obtenue, tous moteurs confondus. */
  bestPosition: number | null;
};

export function groupPrompts(
  prompts: StoredPrompt[],
  labels: Record<string, string> = {},
): GroupedPrompt[] {
  const order: string[] = [];
  const byPrompt = new Map<string, GroupedPrompt>();

  for (const row of prompts) {
    let group = byPrompt.get(row.prompt);
    if (!group) {
      group = {
        prompt: row.prompt,
        citedBy: [],
        absentFrom: [],
        winners: [],
        bestPosition: null,
      };
      byPrompt.set(row.prompt, group);
      order.push(row.prompt);
    }

    const label = labels[row.engine] ?? row.engine;
    if (row.cited) {
      if (!group.citedBy.includes(label)) group.citedBy.push(label);
      if (typeof row.position === "number" && row.position > 0) {
        group.bestPosition =
          group.bestPosition === null
            ? row.position
            : Math.min(group.bestPosition, row.position);
      }
    } else if (!group.absentFrom.includes(label)) {
      group.absentFrom.push(label);
    }

    for (const winner of row.winners) {
      const clean = winner.trim().toLowerCase().replace(/^www\./, "");
      if (clean && !group.winners.includes(clean)) group.winners.push(clean);
    }
  }

  return order.map((prompt) => byPrompt.get(prompt)!);
}
