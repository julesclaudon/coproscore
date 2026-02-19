import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeVilleSlug, makeDeptSlug } from "@/lib/slug";

const BATCH_SIZE = 10000;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://coproscore.fr";

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(
  loc: string,
  opts?: { lastmod?: string; changefreq?: string; priority?: number }
) {
  let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>\n`;
  if (opts?.lastmod) entry += `    <lastmod>${opts.lastmod}</lastmod>\n`;
  if (opts?.changefreq) entry += `    <changefreq>${opts.changefreq}</changefreq>\n`;
  if (opts?.priority != null)
    entry += `    <priority>${opts.priority}</priority>\n`;
  entry += `  </url>\n`;
  return entry;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) return new NextResponse("Not found", { status: 404 });

  const [{ count }] = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM coproprietes WHERE slug IS NOT NULL`
  );
  const coproBatches = Math.ceil(Number(count) / BATCH_SIZE);
  const totalSitemaps = coproBatches + 1;

  if (id < 0 || id >= totalSitemaps)
    return new NextResponse("Not found", { status: 404 });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  if (id === coproBatches) {
    // Last sitemap: static pages + départements + villes
    xml += urlEntry(BASE_URL, { changefreq: "weekly", priority: 1.0 });
    xml += urlEntry(`${BASE_URL}/carte`, { changefreq: "weekly", priority: 0.7 });
    xml += urlEntry(`${BASE_URL}/tarifs`, { changefreq: "monthly", priority: 0.6 });
    xml += urlEntry(`${BASE_URL}/comparateur`, { changefreq: "monthly", priority: 0.5 });
    xml += urlEntry(`${BASE_URL}/methodologie`, { changefreq: "monthly", priority: 0.6 });
    xml += urlEntry(`${BASE_URL}/villes`, { changefreq: "monthly", priority: 0.8 });
    xml += urlEntry(`${BASE_URL}/pro`, { changefreq: "monthly", priority: 0.7 });

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
    for (const d of depts) {
      xml += urlEntry(`${BASE_URL}/villes/${makeDeptSlug(d.nom, d.code)}`, {
        changefreq: "monthly",
        priority: 0.8,
      });
    }

    const villes = await prisma.$queryRawUnsafe<
      { code: string; nom: string }[]
    >(
      `SELECT DISTINCT code_officiel_commune as code, nom_officiel_commune as nom
       FROM coproprietes
       WHERE code_officiel_commune IS NOT NULL
         AND nom_officiel_commune IS NOT NULL`
    );
    for (const v of villes) {
      xml += urlEntry(`${BASE_URL}/ville/${makeVilleSlug(v.nom, v.code)}`, {
        changefreq: "monthly",
        priority: 0.8,
      });
    }
  } else {
    // Copro batch
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
    for (const r of rows) {
      xml += urlEntry(`${BASE_URL}/copropriete/${r.slug}`, {
        lastmod: r.date_derniere_maj
          ? r.date_derniere_maj.toISOString().split("T")[0]
          : undefined,
        changefreq: "monthly",
        priority: 0.7,
      });
    }
  }

  xml += "</urlset>";

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
