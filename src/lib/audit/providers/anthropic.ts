import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlock } from "@anthropic-ai/sdk/resources/messages";
import { engineKeys } from "@/lib/env";
import { toDomain } from "../detect";
import type { EngineAdapter, EngineAnswer, Source } from "../types";

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

      return extractAnswer(response.content);
    },
  };
}

/**
 * Reconstitue texte et sources à partir des blocs de réponse.
 *
 * Isolé et testé à part : c'est le point où l'on se trompe. En particulier,
 * quand l'outil de recherche échoue, `content` n'est pas une liste de
 * résultats mais un objet d'erreur — et le parcours doit le traverser sans
 * exploser.
 */
export function extractAnswer(content: ContentBlock[]): EngineAnswer {
  const text = content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const sources: Source[] = [];
  for (const block of content) {
    if (block.type !== "web_search_tool_result") continue;
    if (!Array.isArray(block.content)) continue;
    for (const result of block.content) {
      if (result.type !== "web_search_result") continue;
      sources.push({
        title: result.title,
        url: result.url,
        domain: toDomain(result.url),
      });
    }
  }

  return { text, sources };
}
