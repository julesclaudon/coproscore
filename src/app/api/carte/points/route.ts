import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_POINTS = 10_000;

interface PointRow {
  lat: number;
  lng: number;
  score: number;
  lots: number | null;
  slug: string;
  nom: string | null;
  adresse: string | null;
  commune: string | null;
  code_postal: string | null;
  type_syndic: string | null;
  periode_construction: string | null;
  dpe_classe_mediane: string | null;
}

function parseBounds(param: string | null): [number, number, number, number] | null {
  if (!param) return null;
  const parts = param.split(",").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return null;
  return parts as [number, number, number, number];
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const bounds = parseBounds(sp.get("bounds"));
  if (!bounds) {
    return NextResponse.json(
      { error: "Missing or invalid bounds parameter (south,west,north,east)" },
      { status: 400 }
    );
  }

  const [south, west, north, east] = bounds;

  // Build dynamic filter clauses
  const conditions: string[] = [
    "latitude BETWEEN $1 AND $3",
    "longitude BETWEEN $2 AND $4",
    "score_global IS NOT NULL",
    "latitude IS NOT NULL",
  ];
  const params: (number | string)[] = [south, west, north, east];
  let paramIdx = 5;

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

  const effectiveLimit = MAX_POINTS;

  // Count total matching
  const countRows = await prisma.$queryRawUnsafe<{ cnt: bigint }[]>(
    `SELECT COUNT(*) as cnt FROM coproprietes WHERE ${whereClause}`,
    ...params
  );
  const total = Number(countRows[0]?.cnt ?? 0);

  // If total exceeds effective limit, sample randomly
  const needsSampling = total > effectiveLimit;
  const limitClause = needsSampling
    ? `ORDER BY RANDOM() LIMIT ${effectiveLimit}`
    : "";

  const rows = await prisma.$queryRawUnsafe<PointRow[]>(
    `SELECT
      latitude AS lat,
      longitude AS lng,
      score_global AS score,
      nb_lots_habitation AS lots,
      numero_immatriculation AS slug,
      nom_usage AS nom,
      adresse_reference AS adresse,
      commune,
      code_postal,
      type_syndic,
      periode_construction,
      dpe_classe_mediane
    FROM coproprietes
    WHERE ${whereClause}
    ${limitClause}`,
    ...params
  );

  const points = rows.map((r) => ({
    lat: Number(r.lat),
    lng: Number(r.lng),
    score: Number(r.score),
    lots: r.lots != null ? Number(r.lots) : 0,
    slug: r.slug,
    nom: r.nom || r.adresse || "Copropriété",
    commune: r.commune,
    codePostal: r.code_postal,
    typeSyndic: r.type_syndic,
    periodeConstruction: r.periode_construction,
    dpeClasse: r.dpe_classe_mediane,
  }));

  return NextResponse.json(
    { points, total, returned: points.length, sampled: needsSampling },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
