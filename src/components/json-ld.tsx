/**
 * Données structurées — la couche GEO technique.
 * Le site de Wield doit être son propre cas d'école : les moteurs de réponse
 * doivent pouvoir extraire l'offre, les entités et les réponses sans ambiguïté.
 */
const SITE = "https://wield.fr";

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "Wield",
      url: SITE,
      description:
        "Wield rend les PME françaises visibles et recommandées sur ChatGPT, Claude, Perplexity et Gemini (GEO/AEO), et les accompagne dans l'adoption interne de l'IA.",
      areaServed: { "@type": "Country", name: "France" },
      knowsAbout: [
        "Generative Engine Optimization",
        "Answer Engine Optimization",
        "Visibilité sur ChatGPT",
        "Adoption de l'IA en PME",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "Wield",
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE}/#organization` },
    },
    {
      "@type": "Service",
      "@id": `${SITE}/#radar`,
      name: "Wield Radar",
      serviceType: "Optimisation de la visibilité sur les moteurs de réponse (GEO)",
      provider: { "@id": `${SITE}/#organization` },
      description:
        "Audit du taux de citation, optimisation du contenu et des données, rapport mensuel de progression sur ChatGPT, Claude, Perplexity et Gemini.",
    },
    {
      "@type": "Service",
      "@id": `${SITE}/#studio`,
      name: "Wield Studio",
      serviceType: "Accompagnement à l'adoption de l'IA en entreprise",
      provider: { "@id": `${SITE}/#organization` },
      description:
        "Diagnostic des usages, mise en place des outils d'IA utiles et formation des équipes.",
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Qu'est-ce que le GEO (Generative Engine Optimization) ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Le GEO consiste à rendre une marque citable par les moteurs de réponse comme ChatGPT, Claude, Perplexity et Gemini. Contrairement au SEO qui vise un classement de liens, le GEO vise la présence dans la réponse générée et parmi les sources citées.",
          },
        },
        {
          "@type": "Question",
          name: "Combien de temps faut-il pour être cité par les IA ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Les premiers signaux apparaissent généralement entre 6 et 12 semaines après la mise en place : structuration du contenu, densité factuelle et signaux d'autorité. Wield mesure le taux de citation chaque mois, moteur par moteur.",
          },
        },
        {
          "@type": "Question",
          name: "Où sont hébergées les données traitées par Wield ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "En Europe. Wield travaille avec un hébergement souverain et applique le RGPD sur l'ensemble des données clients.",
          },
        },
      ],
    },
  ],
};

export function HomeJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
