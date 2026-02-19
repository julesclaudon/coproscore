import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BATCH_SIZE = 10000;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://coproscore.fr";

export async function GET() {
  const [{ count }] = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
    `SELECT COUNT(*) as count FROM coproprietes WHERE slug IS NOT NULL`
  );
  const coproBatches = Math.ceil(Number(count) / BATCH_SIZE);
  const totalSitemaps = coproBatches + 1; // +1 for villes/static pages

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (let i = 0; i < totalSitemaps; i++) {
    xml += `  <sitemap>\n    <loc>${BASE_URL}/sitemap/${i}</loc>\n  </sitemap>\n`;
  }

  xml += "</sitemapindex>";

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
