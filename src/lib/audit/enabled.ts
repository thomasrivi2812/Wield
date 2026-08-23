import type { EngineId } from "./types";

/**
 * Quels moteurs interroger.
 *
 * Volontairement isolé du registre : celui-ci importe les quatre SDK, et ce
 * choix doit rester testable sans en charger aucun.
 *
 * `AUDIT_ENGINES` permet de n'en interroger qu'une partie sans toucher au code
 * ni retirer les clés. Un moteur écarté est traité comme non configuré : il
 * n'entre pas dans le score et n'est jamais compté comme une absence. Retirer
 * sa clé produirait le même effet, mais le diagnostic dirait « pas de clé » —
 * faux, et trompeur au moment de la remettre.
 *
 *   AUDIT_ENGINES=perplexity          → un seul moteur
 *   AUDIT_ENGINES=perplexity,claude   → deux
 *   (variable absente)                → les quatre
 */
const ALL: EngineId[] = ["chatgpt", "claude", "perplexity", "gemini"];

export function enabledEngines(raw = process.env.AUDIT_ENGINES): EngineId[] {
  if (raw === undefined) return ALL;

  const asked = raw
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  // Une valeur vide coupe tout : c'est un choix explicite, pas une erreur.
  return ALL.filter((id) => asked.includes(id));
}
