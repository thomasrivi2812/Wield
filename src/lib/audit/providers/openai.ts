import OpenAI from "openai";
import { parseOpenAI } from "./parse";
import { engineKeys } from "@/lib/env";
import type { EngineAdapter, EngineAnswer } from "../types";

/**
 * ChatGPT, via l'API Responses avec l'outil de recherche web.
 *
 * Comme pour les autres : c'est l'API, pas chatgpt.com. Pas de mémoire, pas
 * de personnalisation, pas le même routage.
 */
const MODEL = process.env.OPENAI_AUDIT_MODEL ?? "gpt-5";

export function openaiAdapter(): EngineAdapter {
  const apiKey = engineKeys.openai;

  if (!apiKey) {
    return {
      id: "chatgpt",
      label: "ChatGPT",
      configured: false,
      unavailableReason: "OPENAI_API_KEY absente",
    };
  }

  const client = new OpenAI({ apiKey });

  return {
    id: "chatgpt",
    label: "ChatGPT",
    configured: true,
    async ask(prompt, signal): Promise<EngineAnswer> {
      const response = await client.responses.create(
        {
          model: MODEL,
          input: prompt,
          instructions:
            "Tu réponds à un acheteur professionnel français qui cherche un " +
            "prestataire. Cite nommément les entreprises que tu recommandes.",
          tools: [
            {
              type: "web_search",
              search_context_size: "medium",
              user_location: { type: "approximate", country: "FR" },
            },
          ],
        },
        { signal },
      );

      return parseOpenAI(response);
    },
  };
}
