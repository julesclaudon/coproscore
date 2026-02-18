import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { makeVilleSlug, makeDeptSlug } from "@/lib/slug";

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
  id: idParam,
}: {
  id: number | Promise<number>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await idParam);
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
      priority: 0.8,
    }));

    const depts = await prisma.$queryRawUnsafe<
      { code: string; nom: string }[]
    >(
      `SELECT DISTINCT code_officiel_departement as code,
              MODE() WITHIN GROUP (ORDER BY nom_officiel_departement) as nom
       FROM coproprietes
       WHERE code_officiel_departement IS NOT NULL
         AND nom_officiel_departement IS NOT NULL
       GROUP BY code_officiel_departement`
    );

    const deptUrls: MetadataRoute.Sitemap = depts.map((d) => ({
      url: `${BASE_URL}/villes/${makeDeptSlug(d.nom, d.code)}`,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

    const staticPages: MetadataRoute.Sitemap = [
      { url: `${BASE_URL}/carte`, changeFrequency: "weekly", priority: 0.7 },
      { url: `${BASE_URL}/tarifs`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${BASE_URL}/comparateur`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE_URL}/methodologie`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${BASE_URL}/villes`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${BASE_URL}/pro`, changeFrequency: "monthly", priority: 0.7 },
    ];

    return [
      {
        url: BASE_URL,
        changeFrequency: "weekly",
        priority: 1.0,
      },
      ...staticPages,
      ...deptUrls,
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
     LIMIT ${BATCH_SIZE} OFFSET ${offset}`
  );

  return rows.map((r) => ({
    url: `${BASE_URL}/copropriete/${r.slug}`,
    lastModified: r.date_derniere_maj ?? undefined,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}
