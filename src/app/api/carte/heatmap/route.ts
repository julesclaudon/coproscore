import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_POINTS = 5000;

interface HeatmapPoint {
  lat: number;
  lng: number;
  score: number;
}

interface RawRow {
  lat: number;
  lng: number;
  score: number;
}

interface ClusterRow {
  lat: number;
  lng: number;
  score: number;
  cnt: bigint;
}

export async function GET(request: NextRequest) {
  const boundsParam = request.nextUrl.searchParams.get("bounds");
  if (!boundsParam) {
    return NextResponse.json(
      { error: "Missing bounds parameter (south,west,north,east)" },
      { status: 400 }
    );
  }

  const parts = boundsParam.split(",").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return NextResponse.json(
      { error: "Invalid bounds format" },
      { status: 400 }
    );
  }

  const [south, west, north, east] = parts;

  // Count copros in bounds
  const countRows = await prisma.$queryRawUnsafe<{ cnt: bigint }[]>(
    `SELECT COUNT(*) as cnt
     FROM coproprietes
     WHERE latitude BETWEEN $1 AND $3
       AND longitude BETWEEN $2 AND $4
       AND score_global IS NOT NULL
       AND latitude IS NOT NULL`,
    south,
    west,
    north,
    east
  );

  const total = Number(countRows[0]?.cnt ?? 0);

  let points: HeatmapPoint[];

  if (total <= MAX_POINTS) {
    // Return individual points
    const rows = await prisma.$queryRawUnsafe<RawRow[]>(
      `SELECT
        latitude AS lat,
        longitude AS lng,
        score_global AS score
      FROM coproprietes
      WHERE latitude BETWEEN $1 AND $3
        AND longitude BETWEEN $2 AND $4
        AND score_global IS NOT NULL
        AND latitude IS NOT NULL
      LIMIT $5`,
      south,
      west,
      north,
      east,
      MAX_POINTS
    );

    points = rows.map((r) => ({
      lat: Number(r.lat),
      lng: Number(r.lng),
      score: Number(r.score),
    }));
  } else {
    // Cluster: divide viewport into ~50x50 grid cells
    const latStep = (north - south) / 50;
    const lngStep = (east - west) / 50;

    const rows = await prisma.$queryRawUnsafe<ClusterRow[]>(
      `SELECT
        ROUND((latitude / $5)::numeric, 0) * $5 AS lat,
        ROUND((longitude / $6)::numeric, 0) * $6 AS lng,
        ROUND(AVG(score_global)::numeric, 0) AS score,
        COUNT(*) AS cnt
      FROM coproprietes
      WHERE latitude BETWEEN $1 AND $3
        AND longitude BETWEEN $2 AND $4
        AND score_global IS NOT NULL
        AND latitude IS NOT NULL
      GROUP BY ROUND((latitude / $5)::numeric, 0), ROUND((longitude / $6)::numeric, 0)`,
      south,
      west,
      north,
      east,
      latStep,
      lngStep
    );

    points = rows.map((r) => ({
      lat: Number(r.lat),
      lng: Number(r.lng),
      score: Number(r.score),
    }));
  }

  return NextResponse.json(
    { points, total, clustered: total > MAX_POINTS },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
