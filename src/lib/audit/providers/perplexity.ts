import Perplexity from "@perplexity-ai/perplexity_ai";
import { engineKeys } from "@/lib/env";
import { parsePerplexity, perplexityUsage } from "./parse";
import type { EngineAdapter, EngineAnswer } from "../types";

/** Perplexity est le moteur le plus proche de son produit grand public : sa
 *  réponse est nativement adossée à une recherche, comme dans l'application. */
const MODEL = process.env.PERPLEXITY_AUDIT_MODEL ?? "sonar";


export function perplexityAdapter(): EngineAdapter {
  const apiKey = engineKeys.perplexity;

  if (!apiKey) {
    return {
      id: "perplexity",
      label: "Perplexity",
      configured: false,
      unavailableReason: "PERPLEXITY_API_KEY absente",
    };
  }

  const client = new Perplexity({ apiKey });

  return {
    id: "perplexity",
    label: "Perplexity",
    configured: true,
    async ask(prompt, signal): Promise<EngineAnswer> {
      const response = await client.chat.completions.create(
        {
          model: MODEL,
          messages: [
            {
              role: "system",
              content:
                "Tu réponds à un acheteur professionnel français qui cherche " +
                "un prestataire. Cite nommément les entreprises recommandées.",
            },
            { role: "user", content: prompt },
          ],
        },
        { signal },
      );

      return { ...parsePerplexity(response), usage: perplexityUsage(response) };
    },
  };
}
