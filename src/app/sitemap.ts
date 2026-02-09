import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { makeVilleSlug } from "@/lib/slug";

const BATCH_SIZE = 50000;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://coproscore.fr";

export async function generateSitemaps() {
  const [{ count }] = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM coproprietes WHERE slug IS NOT NULL`
  );
  const total = Number(count);

  // Copro sitemaps (batches of 50K)
  const coproBatches = Math.ceil(total / BATCH_SIZE);

  // +1 extra sitemap for ville pages + homepage
  return Array.from({ length: coproBatches + 1 }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const [{ count }] = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM coproprietes WHERE slug IS NOT NULL`
  );
  const coproBatches = Math.ceil(Number(count) / BATCH_SIZE);

  // Last sitemap: ville pages + homepage
  if (id >= coproBatches) {
    const villes = await prisma.$queryRawUnsafe<
      { code: string; nom: string }[]
    >(
      `SELECT DISTINCT code_officiel_commune as code, nom_officiel_commune as nom
       FROM coproprietes
       WHERE code_officiel_commune IS NOT NULL
         AND nom_officiel_commune IS NOT NULL`
    );

    const villeUrls: MetadataRoute.Sitemap = villes.map((v) => ({
      url: `${BASE_URL}/ville/${makeVilleSlug(v.nom, v.code)}`,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [
      {
        url: BASE_URL,
        changeFrequency: "weekly",
        priority: 1.0,
      },
      ...villeUrls,
    ];
  }

  // Copro sitemaps
  const offset = id * BATCH_SIZE;
  const rows = await prisma.$queryRawUnsafe<
    { slug: string; date_derniere_maj: Date | null }[]
  >(
    `SELECT slug, date_derniere_maj
     FROM coproprietes
     WHERE slug IS NOT NULL
     ORDER BY id
     LIMIT $1 OFFSET $2`,
    BATCH_SIZE,
    offset
  );

  return rows.map((r) => ({
    url: `${BASE_URL}/copropriete/${r.slug}`,
    lastModified: r.date_derniere_maj ?? undefined,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}
