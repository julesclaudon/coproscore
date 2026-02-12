import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/recherche", "/favoris", "/historique", "/alertes"],
    },
    sitemap: Array.from(
      { length: 14 },
      (_, i) => `https://coproscore.fr/sitemap/${i}.xml`
    ),
  };
}
