import type { MetadataRoute } from "next";

const SITE = "https://wield.fr";

/** /audit et /espace sont en noindex : ils n'ont rien à faire ici. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: SITE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE}/guides`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE}/infrastructure`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE}/quiz`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
