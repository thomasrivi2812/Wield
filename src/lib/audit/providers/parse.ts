import type { ContentBlock } from "@anthropic-ai/sdk/resources/messages";
import type { GenerateContentResponse } from "@google/genai";
import type PerplexityClient from "@perplexity-ai/perplexity_ai";
import type { Response as OpenAIResponse } from "openai/resources/responses/responses";
import { toDomain } from "../detect";
import type { EngineAnswer, Source } from "../types";

/**
 * Lecture des réponses, un fournisseur par fonction.
 *
 * Ces fonctions sont pures et n'importent que des types : aucun SDK n'est
 * chargé pour les exécuter. C'est ce qui les rend testables sans clé, sans
 * réseau, et sans payer le coût d'import de quatre SDK.
 *
 * C'est aussi l'endroit où l'on se trompe : chaque fournisseur range ses
 * sources ailleurs — bloc dédié chez Anthropic, annotations sur le texte chez
 * OpenAI, champ séparé chez Perplexity, métadonnées d'ancrage chez Google.
 */

function collect(): {
  push: (url: string | undefined, title: string | undefined) => void;
  sources: Source[];
} {
  const seen = new Set<string>();
  const sources: Source[] = [];
  return {
    sources,
    push(url, title) {
      if (!url || seen.has(url)) return;
      seen.add(url);
      sources.push({ title: title ?? url, url, domain: toDomain(url) });
    },
  };
}

/** Anthropic : un bloc `web_search_tool_result` porte la liste des résultats. */
export function parseAnthropic(content: ContentBlock[]): EngineAnswer {
  const text = content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const out = collect();
  for (const block of content) {
    if (block.type !== "web_search_tool_result") continue;
    // Quand l'outil échoue, `content` est un objet d'erreur, pas une liste.
    if (!Array.isArray(block.content)) continue;
    for (const result of block.content) {
      if (result.type !== "web_search_result") continue;
      out.push(result.url, result.title);
    }
  }

  return { text, sources: out.sources };
}

/** OpenAI : les sources sont des annotations posées sur les segments de texte. */
export function parseOpenAI(response: OpenAIResponse): EngineAnswer {
  const out = collect();

  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type !== "output_text") continue;
      for (const annotation of part.annotations ?? []) {
        if (annotation.type !== "url_citation") continue;
        out.push(annotation.url, annotation.title);
      }
    }
  }

  return { text: response.output_text ?? "", sources: out.sources };
}

/** La signature du SDK couvre aussi le flux ; on n'utilise que la réponse complète. */
export type PerplexityCompletion = Extract<
  Awaited<ReturnType<PerplexityClient["chat"]["completions"]["create"]>>,
  { choices: unknown }
>;

/** Perplexity : les sources arrivent dans un champ dédié, pas dans le texte. */
export function parsePerplexity(response: PerplexityCompletion): EngineAnswer {
  const raw = response.choices?.[0]?.message?.content;
  const text =
    typeof raw === "string"
      ? raw
      : Array.isArray(raw)
        ? raw
            .map((chunk) =>
              chunk && typeof chunk === "object" && "text" in chunk
                ? String((chunk as { text?: unknown }).text ?? "")
                : "",
            )
            .join("")
        : "";

  const out = collect();
  for (const result of response.search_results ?? []) {
    out.push(result?.url, result?.title);
  }

  return { text, sources: out.sources };
}

/** Google : métadonnées d'ancrage du premier candidat. Seuls les fragments
 *  web portent une URL — un fragment peut venir d'une carte ou d'une image. */
export function parseGemini(response: GenerateContentResponse): EngineAnswer {
  const chunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

  const out = collect();
  for (const chunk of chunks) {
    out.push(chunk.web?.uri, chunk.web?.title);
  }

  return { text: response.text ?? "", sources: out.sources };
}
