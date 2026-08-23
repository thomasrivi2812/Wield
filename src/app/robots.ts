import type { MetadataRoute } from "next";

const SITE = "https://wield.fr";

/**
 * On autorise explicitement les crawlers des moteurs de réponse.
 * Être crawlable par eux est la condition zéro du GEO.
 */
export default function robots(): MetadataRoute.Robots {
  const allowAll = { allow: "/", disallow: ["/api/"] };

  return {
    rules: [
      { userAgent: "*", ...allowAll },
      { userAgent: "GPTBot", ...allowAll },
      { userAgent: "OAI-SearchBot", ...allowAll },
      { userAgent: "ChatGPT-User", ...allowAll },
      { userAgent: "ClaudeBot", ...allowAll },
      { userAgent: "Claude-Web", ...allowAll },
      { userAgent: "anthropic-ai", ...allowAll },
      { userAgent: "PerplexityBot", ...allowAll },
      { userAgent: "Perplexity-User", ...allowAll },
      { userAgent: "Google-Extended", ...allowAll },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
