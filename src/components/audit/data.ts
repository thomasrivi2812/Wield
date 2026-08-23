/**
 * Données de démonstration du tunnel d'audit.
 * Elles seront remplacées par la réponse du Route Handler qui interroge
 * réellement les quatre moteurs (clés API côté serveur, rate-limiting).
 */

export type Engine = {
  name: string;
  cited: boolean;
  detail: string;
  rate: string;
};

export const ENGINES: Engine[] = [
  { name: "ChatGPT", cited: true, detail: "3ᵉ source citée", rate: "1 prompt sur 6" },
  { name: "Claude", cited: false, detail: "aucune mention", rate: "0 prompt sur 6" },
  { name: "Perplexity", cited: false, detail: "aucune mention", rate: "0 prompt sur 6" },
  { name: "Gemini", cited: false, detail: "aucune mention", rate: "0 prompt sur 6" },
];

export type PromptRow = {
  prompt: string;
  cited: boolean;
  winners: string[];
};

export const PROMPTS: PromptRow[] = [
  {
    prompt: "Quel prestataire pour de la menuiserie industrielle à Lyon ?",
    cited: false,
    winners: ["Concurrent A", "Concurrent B", "Annuaire Pro"],
  },
  {
    prompt: "Menuiserie sur mesure certifiée en Auvergne-Rhône-Alpes",
    cited: true,
    winners: ["Concurrent A", "Ta boîte"],
  },
  {
    prompt: "Qui fabrique des agencements bois pour l'hôtellerie ?",
    cited: false,
    winners: ["Concurrent C", "Concurrent A"],
  },
  {
    prompt: "Menuisier industriel fiable délais courts Rhône",
    cited: false,
    winners: ["Annuaire Pro", "Concurrent B"],
  },
  {
    prompt: "Entreprise d'agencement sur mesure Lyon avis",
    cited: false,
    winners: ["Concurrent B", "Concurrent A", "Annuaire Pro"],
  },
  {
    prompt: "Fabricant menuiserie bois professionnel Rhône-Alpes",
    cited: false,
    winners: ["Concurrent A", "Concurrent C"],
  },
];

export const ACTIONS = [
  {
    priority: "Priorité haute",
    title: "Créer une page « réponse » par prompt métier",
    body: "Six pages manquent, une par question que tes clients posent réellement. Réponse en tête, faits vérifiables ensuite.",
  },
  {
    priority: "Priorité haute",
    title: "Publier tes données factuelles",
    body: "Certifications, délais, capacité de production, zone d'intervention : les IA citent ce qu'elles peuvent vérifier.",
  },
  {
    priority: "Priorité moyenne",
    title: "Baliser le site en JSON-LD",
    body: "Organization, Service, FAQPage. Sans ça, ton offre n'est pas lisible comme une entité.",
  },
  {
    priority: "Priorité moyenne",
    title: "Ouvrir robots.txt aux crawlers de réponse",
    body: "GPTBot, ClaudeBot, PerplexityBot et Google-Extended sont actuellement bloqués sur deux répertoires.",
  },
];

export const SEO_CHECKS = [
  { label: "Balises title et meta description", status: "warn", note: "12 pages sans description" },
  { label: "Structure Hn", status: "fail", note: "4 pages sans H1" },
  { label: "Performance mobile", status: "warn", note: "LCP à 3,4 s" },
  { label: "Maillage interne", status: "ok", note: "cohérent" },
  { label: "Données structurées", status: "fail", note: "absentes" },
  { label: "Sitemap et indexation", status: "ok", note: "94 pages indexées" },
] as const;
