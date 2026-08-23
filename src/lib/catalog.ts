/**
 * Le catalogue. Source unique des références et des prix.
 *
 * Un prix affiché ailleurs qu'ici finit toujours par diverger de ce qui est
 * réellement débité. Les pages lisent ce fichier, et la session de paiement
 * aussi : impossible d'annoncer 2,99 € et d'encaisser 3,99 €.
 */

export type Sku =
  | "report_geo"
  | "audit_seo_geo"
  | "guide_citable"
  | "guide_prompts"
  | "guide_donnees"
  | "guide_equipe"
  | "guide_charte"
  | "guide_automatiser"
  | "pack"
  | "brief";

export type Product = {
  sku: Sku;
  name: string;
  description: string;
  /** En centimes : jamais de flottant pour de l'argent. */
  amountCents: number;
  mode: "payment" | "subscription";
  /** Ce que l'achat débloque, pour l'espace membre. */
  kind: "rapport" | "guide" | "pack" | "abonnement";
};

export const CATALOG: Record<Sku, Product> = {
  report_geo: {
    sku: "report_geo",
    name: "Plan d’action GEO",
    description: "Ce qu’il faut corriger pour être cité, priorisé par impact.",
    amountCents: 299,
    mode: "payment",
    kind: "rapport",
  },
  audit_seo_geo: {
    sku: "audit_seo_geo",
    name: "Audit SEO + GEO",
    description: "Le plan d’action GEO, plus l’audit technique du site.",
    amountCents: 1000,
    mode: "payment",
    kind: "rapport",
  },
  guide_citable: {
    sku: "guide_citable",
    name: "Rendre ton site citable par les IA",
    description: "La méthode GEO complète, de l’audit à la première citation.",
    amountCents: 2900,
    mode: "payment",
    kind: "guide",
  },
  guide_prompts: {
    sku: "guide_prompts",
    name: "Les 40 questions que tes clients posent à l’IA",
    description: "Les prompts réels de ton secteur, et qui sort dessus aujourd’hui.",
    amountCents: 1900,
    mode: "payment",
    kind: "guide",
  },
  guide_donnees: {
    sku: "guide_donnees",
    name: "Structurer ses données pour les moteurs de réponse",
    description: "JSON-LD, llms.txt, robots.txt, sitemap : le socle, pas à pas.",
    amountCents: 3900,
    mode: "payment",
    kind: "guide",
  },
  guide_equipe: {
    sku: "guide_equipe",
    name: "Installer l’IA dans une équipe de dix",
    description: "Quels outils, pour qui, dans quel ordre — sans usine à gaz.",
    amountCents: 4900,
    mode: "payment",
    kind: "guide",
  },
  guide_charte: {
    sku: "guide_charte",
    name: "Écrire la charte IA de ta boîte",
    description: "Ce que tes équipes ont le droit de faire, et avec quelles données.",
    amountCents: 2900,
    mode: "payment",
    kind: "guide",
  },
  guide_automatiser: {
    sku: "guide_automatiser",
    name: "Automatiser dix tâches sans écrire une ligne de code",
    description: "Devis, relances, comptes rendus : les automatismes qui tiennent.",
    amountCents: 3900,
    mode: "payment",
    kind: "guide",
  },
  pack: {
    sku: "pack",
    name: "Le pack complet",
    description: "Les six guides et l’audit SEO + GEO automatique chaque mois.",
    amountCents: 12900,
    mode: "payment",
    kind: "pack",
  },
  brief: {
    sku: "brief",
    name: "Le Brief",
    description: "La veille hebdomadaire et le comparateur de prix des IA.",
    amountCents: 900,
    mode: "subscription",
    kind: "abonnement",
  },
};

export const GUIDE_SKUS: Sku[] = [
  "guide_citable",
  "guide_prompts",
  "guide_donnees",
  "guide_equipe",
  "guide_charte",
  "guide_automatiser",
];

export function isSku(value: unknown): value is Sku {
  // `in` traverse la chaîne de prototypes : « constructor », « toString » et
  // consorts passeraient le filtre et donneraient un objet sans prix. Une
  // référence envoyée par le réseau doit être une clé propre, rien d'autre.
  return typeof value === "string" && Object.hasOwn(CATALOG, value);
}

const EUROS = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** « 2,99 € » pour 299, « 29 € » pour 2900 : pas de décimales inutiles. */
export function formatPrice(amountCents: number): string {
  return EUROS.format(amountCents / 100);
}

/** Prix barré du pack : ce que coûterait le même contenu à l'unité. */
export function packListPrice(): number {
  return (
    GUIDE_SKUS.reduce((sum, sku) => sum + CATALOG[sku].amountCents, 0) +
    CATALOG.audit_seo_geo.amountCents
  );
}
