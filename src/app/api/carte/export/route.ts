import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCsv } from "@/lib/csv-export";
import { formatCoproName } from "@/lib/utils";
import { formatPeriod } from "@/lib/format";
import { isDevUnlocked } from "@/lib/dev-mode";

const MAX_EXPORT = 10_000;

interface ExportRow {
  nom_usage: string | null;
  adresse_reference: string | null;
  code_postal: string | null;
  commune: string | null;
  score_global: number | null;
  nb_lots_habitation: number | null;
  type_syndic: string | null;
  periode_construction: string | null;
  dpe_classe_mediane: string | null;
}

export async function GET(request: NextRequest) {
  if (!isDevUnlocked()) {
    return NextResponse.json(
      { error: "Accès réservé aux utilisateurs Pro" },
      { status: 403 }
    );
  }

  const sp = request.nextUrl.searchParams;

  // Build dynamic filter clauses
  const conditions: string[] = [
    "score_global IS NOT NULL",
    "latitude IS NOT NULL",
  ];
  const params: (number | string)[] = [];
  let paramIdx = 1;

  const scoreMin = sp.get("scoreMin");
  if (scoreMin) {
    conditions.push(`score_global >= $${paramIdx}`);
    params.push(Number(scoreMin));
    paramIdx++;
  }

  const scoreMax = sp.get("scoreMax");
  if (scoreMax) {
    conditions.push(`score_global <= $${paramIdx}`);
    params.push(Number(scoreMax));
    paramIdx++;
  }

  const lotsMin = sp.get("lotsMin");
  if (lotsMin && Number(lotsMin) > 0) {
    conditions.push(`nb_lots_habitation >= $${paramIdx}`);
    params.push(Number(lotsMin));
    paramIdx++;
  }

  const lotsMax = sp.get("lotsMax");
  if (lotsMax && Number(lotsMax) < 500) {
    conditions.push(`nb_lots_habitation <= $${paramIdx}`);
    params.push(Number(lotsMax));
    paramIdx++;
  }

  const syndic = sp.get("syndic");
  if (syndic) {
    const syndicValues = syndic.split(",").filter(Boolean);
    if (syndicValues.length > 0) {
      const placeholders = syndicValues.map((_, i) => `$${paramIdx + i}`).join(",");
      conditions.push(`type_syndic IN (${placeholders})`);
      params.push(...syndicValues);
      paramIdx += syndicValues.length;
    }
  }

  const periode = sp.get("periode");
  if (periode) {
    const periodeValues = periode.split(",").filter(Boolean);
    if (periodeValues.length > 0) {
      const placeholders = periodeValues.map((_, i) => `$${paramIdx + i}`).join(",");
      conditions.push(`periode_construction IN (${placeholders})`);
      params.push(...periodeValues);
      paramIdx += periodeValues.length;
    }
  }

  const whereClause = conditions.join(" AND ");

  const copros = await prisma.$queryRawUnsafe<ExportRow[]>(
    `SELECT nom_usage, adresse_reference, code_postal, commune, score_global,
            nb_lots_habitation, type_syndic, periode_construction, dpe_classe_mediane
     FROM coproprietes
     WHERE ${whereClause}
     ORDER BY score_global DESC NULLS LAST, id ASC
     LIMIT ${MAX_EXPORT}`,
    ...params
  );

  const csvHeaders = [
    "Nom",
    "Adresse",
    "Code postal",
    "Commune",
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
    c.commune || "\u2014",
    c.score_global != null ? String(c.score_global) : "\u2014",
    c.nb_lots_habitation != null ? String(c.nb_lots_habitation) : "\u2014",
    c.type_syndic || "\u2014",
    formatPeriod(c.periode_construction) || "\u2014",
    c.dpe_classe_mediane || "\u2014",
  ]);

  const csv = generateCsv(csvHeaders, rows);
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="coproprietes-carte-${today}.csv"`,
    },
  });
}
