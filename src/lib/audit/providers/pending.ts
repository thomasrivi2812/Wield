import { engineKeys } from "@/lib/env";
import type { EngineAdapter, EngineId } from "../types";

/**
 * Adaptateurs pas encore écrits.
 *
 * Ils sont volontairement vides plutôt qu'approximatifs : un appel HTTP écrit
 * de mémoire, sans la documentation du fournisseur sous les yeux, produit du
 * code qui a l'air fini et qui échoue en production. Un moteur non implémenté
 * sort du score au lieu de compter comme « absent ».
 *
 * Pour chacun, ce qu'il reste à faire :
 *
 * ChatGPT — API OpenAI, endpoint Responses, avec l'outil `web_search` activé.
 *   Il faut : le nom exact de l'endpoint et sa version, la forme du paramètre
 *   `tools`, et le chemin des annotations d'URL dans la réponse (ce sont elles
 *   qui donnent les sources).
 *
 * Perplexity — API Sonar, compatible « chat/completions ». Les sources
 *   arrivent dans un champ dédié de la réponse, distinct du texte. Il faut le
 *   nom exact de ce champ et le modèle à cibler.
 *
 * Gemini — API Google Generative Language, `generateContent` avec l'outil
 *   d'ancrage sur la recherche Google. Il faut la forme exacte de l'outil
 *   d'ancrage et le chemin des métadonnées de sources dans la réponse.
 *
 * Dès que la doc est accessible, chaque adaptateur tient en une fonction
 * `ask()` qui renvoie `{ text, sources }` : le reste du moteur ne bouge pas.
 */
function pending(
  id: EngineId,
  label: string,
  key: string | undefined,
  keyName: string,
): EngineAdapter {
  return {
    id,
    label,
    configured: Boolean(key),
    unavailableReason: key
      ? "adaptateur pas encore écrit"
      : `${keyName} absente`,
  };
}

export function openaiAdapter(): EngineAdapter {
  return pending("chatgpt", "ChatGPT", engineKeys.openai, "OPENAI_API_KEY");
}

export function perplexityAdapter(): EngineAdapter {
  return pending(
    "perplexity",
    "Perplexity",
    engineKeys.perplexity,
    "PERPLEXITY_API_KEY",
  );
}

export function geminiAdapter(): EngineAdapter {
  return pending("gemini", "Gemini", engineKeys.google, "GOOGLE_AI_API_KEY");
}
