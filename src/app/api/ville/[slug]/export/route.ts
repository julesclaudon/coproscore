import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseVilleSlug } from "@/lib/slug";
import { generateCsv } from "@/lib/csv-export";
import { formatCoproName } from "@/lib/utils";
import { formatPeriod } from "@/lib/format";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const codeCommune = parseVilleSlug(slug);

  if (!codeCommune) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const cp = request.nextUrl.searchParams.get("cp");
  const hasValidCp = cp != null && /^\d{5}$/.test(cp);

  const cpClause = hasValidCp ? "AND code_postal = $2" : "";
  const queryParams: (string | number)[] = hasValidCp
    ? [codeCommune, cp]
    : [codeCommune];

  const copros = await prisma.$queryRawUnsafe<
    {
      nom_usage: string | null;
      adresse_reference: string | null;
      code_postal: string | null;
      score_global: number | null;
      nb_lots_habitation: number | null;
      type_syndic: string | null;
      periode_construction: string | null;
      dpe_classe_mediane: string | null;
    }[]
  >(
    `SELECT nom_usage, adresse_reference, code_postal, score_global,
            nb_lots_habitation, type_syndic, periode_construction, dpe_classe_mediane
     FROM coproprietes
     WHERE code_officiel_commune = $1 ${cpClause}
     ORDER BY score_global DESC NULLS LAST, id ASC
     LIMIT 1000`,
    ...queryParams
  );

  const headers = [
    "Nom",
    "Adresse",
    "Code postal",
    "Score",
    "Lots habitation",
    "Syndic",
    "Construction",
    "DPE",
  ];

  const rows = copros.map((c) => [
    formatCoproName(c.nom_usage || c.adresse_reference || "\u2014"),
    c.adresse_reference || "\u2014",
    c.code_postal || "\u2014",
    c.score_global != null ? String(c.score_global) : "\u2014",
    c.nb_lots_habitation != null ? String(c.nb_lots_habitation) : "\u2014",
    c.type_syndic || "\u2014",
    formatPeriod(c.periode_construction) || "\u2014",
    c.dpe_classe_mediane || "\u2014",
  ]);

  const csv = generateCsv(headers, rows);
  const today = new Date().toISOString().slice(0, 10);

  // Extract ville name from slug (remove the code at end)
  const villeName = slug.replace(/-\d{5}$/, "");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="coproprietes-${villeName}-${today}.csv"`,
    },
  });
}
