import { anthropicAdapter } from "./anthropic";
import { geminiAdapter, openaiAdapter, perplexityAdapter } from "./pending";
import type { EngineAdapter } from "../types";

/** L'ordre fixe l'affichage : il ne doit pas dépendre du résultat. */
export function adapters(): EngineAdapter[] {
  return [
    openaiAdapter(),
    anthropicAdapter(),
    perplexityAdapter(),
    geminiAdapter(),
  ];
}
