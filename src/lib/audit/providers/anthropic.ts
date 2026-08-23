import Anthropic from "@anthropic-ai/sdk";
import { parseAnthropic } from "./parse";
import { engineKeys } from "@/lib/env";
import type { EngineAdapter, EngineAnswer } from "../types";

/**
 * Claude, via l'API Messages avec l'outil de recherche web côté serveur.
 *
 * Ce n'est pas claude.ai : pas de mémoire, pas de personnalisation, pas le
 * même routage. C'est un substitut reproductible et comparable dans le temps,
 * et le site doit le dire tel quel.
 */
const MODEL = "claude-opus-5";

export function anthropicAdapter(): EngineAdapter {
  const apiKey = engineKeys.anthropic;

  if (!apiKey) {
    return {
      id: "claude",
      label: "Claude",
      configured: false,
      unavailableReason: "ANTHROPIC_API_KEY absente",
    };
  }

  const client = new Anthropic({ apiKey });

  return {
    id: "claude",
    label: "Claude",
    configured: true,
    async ask(prompt, signal): Promise<EngineAnswer> {
      const response = await client.messages.create(
        {
          model: MODEL,
          max_tokens: 16000,
          // Question de repérage, pas de raisonnement : l'effort minimal suffit
          // et divise la facture d'un audit.
          output_config: { effort: "low" },
          system:
            "Tu réponds à un acheteur professionnel français qui cherche un " +
            "prestataire. Cite nommément les entreprises que tu recommandes et " +
            "appuie-toi sur des sources vérifiables.",
          tools: [
            {
              type: "web_search_20260209",
              name: "web_search",
              max_uses: 3,
              user_location: { type: "approximate", country: "FR" },
            },
          ],
          messages: [{ role: "user", content: prompt }],
        },
        { signal },
      );

      return parseAnthropic(response.content);
    },
  };
}
