/**
 * Nettoie le paramètre `next` d'un retour d'authentification.
 *
 * Sans ce filtre, `?next=https://evil.com` transforme le callback en
 * redirection ouverte : l'attaquant envoie un lien portant le domaine de
 * Wield, la victime se connecte, et repart chez lui avec la confiance
 * accumulée. On n'accepte donc qu'un chemin interne.
 */
export function safeNext(value: string | null | undefined, fallback = "/espace"): string {
  if (!value) return fallback;
  // Doit commencer par une seule barre oblique : « // » ouvre sur un hôte.
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  // « /\evil.com » est traité comme « //evil.com » par certains navigateurs.
  if (value.startsWith("/\\")) return fallback;
  // Un schéma glissé dans le chemin ne doit pas passer.
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(value)) return fallback;
  return value;
}
