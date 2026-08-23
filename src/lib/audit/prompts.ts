/**
 * Les questions envoyées aux moteurs.
 *
 * On reste sur des formulations d'acheteur — « qui me recommandes-tu pour X »
 * — et non sur des requêtes de type mot-clé : c'est ce que les gens tapent
 * vraiment dans un assistant, et c'est ce qu'on prétend mesurer.
 */
const TEMPLATES = [
  (q: string) => `Quel prestataire fiable pour ${q} ?`,
  (q: string) => `Quelles sont les meilleures entreprises pour ${q} ?`,
  (q: string) => `Je cherche un professionnel pour ${q}. Qui me recommandes-tu ?`,
  (q: string) => `${q} : quelles entreprises ont bonne réputation ?`,
  (q: string) => `Comment choisir un prestataire pour ${q} , et lesquels citer ?`,
  (q: string) => `Entreprises spécialisées en ${q} : lesquelles ressortent ?`,
];

export const PROMPTS_PER_AUDIT = TEMPLATES.length;

export function buildPrompts(query: string): string[] {
  const clean = query.trim().replace(/\s+/g, " ");
  return TEMPLATES.map((build) => build(clean));
}
