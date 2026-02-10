import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/recherche"],
    },
    sitemap: "https://coproscore.fr/sitemap.xml",
  };
}
