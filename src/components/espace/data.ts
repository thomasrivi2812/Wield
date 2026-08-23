/** Contenu de démonstration de l'espace membre. */

export const ACCOUNT = {
  name: "Prénom Nom",
  company: "Menuiserie Exemple",
  plan: "Pack complet",
};

export type Audit = {
  date: string;
  query: string;
  score: number;
  max: number;
  tier: "Score seul" | "Rapport GEO" | "SEO + GEO";
  auto?: boolean;
};

export const AUDITS: Audit[] = [
  {
    date: "12 août 2026",
    query: "menuiserie industrielle, Lyon",
    score: 2,
    max: 4,
    tier: "SEO + GEO",
    auto: true,
  },
  {
    date: "12 juillet 2026",
    query: "menuiserie industrielle, Lyon",
    score: 1,
    max: 4,
    tier: "SEO + GEO",
    auto: true,
  },
  {
    date: "12 juin 2026",
    query: "agencement sur mesure hôtellerie",
    score: 1,
    max: 4,
    tier: "Rapport GEO",
  },
  {
    date: "28 mai 2026",
    query: "menuiserie industrielle, Lyon",
    score: 0,
    max: 4,
    tier: "Score seul",
  },
];

export type Resource = {
  kind: "Guide" | "Rapport" | "Abonnement";
  title: string;
  meta: string;
  action: string;
};

export const RESOURCES: Resource[] = [
  {
    kind: "Guide",
    title: "Rendre ton site citable par les IA",
    meta: "PDF · 48 pages · mis à jour le 2 août 2026",
    action: "Télécharger",
  },
  {
    kind: "Guide",
    title: "Structurer ses données pour les moteurs de réponse",
    meta: "PDF · 32 pages · mis à jour le 14 juillet 2026",
    action: "Télécharger",
  },
  {
    kind: "Guide",
    title: "Automatiser dix tâches sans écrire une ligne de code",
    meta: "PDF · 40 pages · mis à jour le 9 juin 2026",
    action: "Télécharger",
  },
  {
    kind: "Rapport",
    title: "Audit SEO + GEO — août 2026",
    meta: "PDF · 12 pages · généré le 12 août 2026",
    action: "Télécharger",
  },
  {
    kind: "Abonnement",
    title: "Le Brief",
    meta: "Actif · prochaine édition le 27 août 2026",
    action: "Gérer",
  },
];

export type Message = {
  from: "team" | "me";
  author: string;
  time: string;
  body: string;
};

export const THREAD: Message[] = [
  {
    from: "team",
    author: "Équipe Wield",
    time: "12 août, 09:14",
    body: "Ton audit d’août est en ligne : tu passes de 1 à 2 citations sur 4. Perplexity te cite depuis la mise à jour des pages métier.",
  },
  {
    from: "me",
    author: "Toi",
    time: "12 août, 10:02",
    body: "Bonne nouvelle. Et pour Gemini, il manque quoi selon vous ?",
  },
  {
    from: "team",
    author: "Équipe Wield",
    time: "12 août, 11:20",
    body: "Gemini s’appuie beaucoup sur les signaux d’autorité externes. On te propose deux actions : faire citer tes certifications sur deux annuaires métier, et publier la page « capacité de production » qu’on a préparée. Je te mets le brouillon dans tes ressources.",
  },
];
