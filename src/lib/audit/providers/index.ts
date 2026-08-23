import { anthropicAdapter } from "./anthropic";
import { geminiAdapter } from "./gemini";
import { openaiAdapter } from "./openai";
import { perplexityAdapter } from "./perplexity";
import { enabledEngines } from "../enabled";
import type { EngineAdapter } from "../types";

/** L'ordre fixe l'affichage : il ne doit pas dépendre du résultat. */
export function adapters(): EngineAdapter[] {
  const enabled = new Set(enabledEngines());

  return [
    openaiAdapter(),
    anthropicAdapter(),
    perplexityAdapter(),
    geminiAdapter(),
  ].map((adapter) =>
    enabled.has(adapter.id)
      ? adapter
      : {
          ...adapter,
          // `ask` retiré : c'est ce qui garantit qu'aucun appel ne part.
          ask: undefined,
          unavailableReason: "moteur désactivé sur ce déploiement",
        },
  );
}
