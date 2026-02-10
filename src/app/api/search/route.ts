import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RADIUS_METERS = 100;
const LAT_PER_METER = 1 / 111320;
const LON_PER_METER = 1 / 77370;

const SELECT_COLS = `id, slug, adresse_reference, commune_adresse, code_postal, nom_usage,
            score_global, nb_lots_habitation, longitude, latitude, type_syndic, periode_construction`;

interface BanFeature {
  geometry: { coordinates: [number, number] };
  properties: { housenumber?: string; street?: string; postcode?: string; city?: string; name?: string };
}

interface CoproRow {
  id: number;
  slug: string | null;
  adresse_reference: string | null;
  commune_adresse: string | null;
  code_postal: string | null;
  nom_usage: string | null;
  score_global: number | null;
  nb_lots_habitation: number | null;
  longitude: number | null;
  latitude: number | null;
  distance_m: number | null;
  type_syndic: string | null;
  periode_construction: string | null;
}

type SortKey = "pertinence" | "score_desc" | "score_asc" | "distance" | "lots";

function buildOrderClause(sort: SortKey, mode: "geo" | "postal" | "text"): string {
  switch (sort) {
    case "score_desc":
      return "ORDER BY score_global DESC NULLS LAST, id ASC";
    case "score_asc":
      return "ORDER BY score_global ASC NULLS LAST, id ASC";
    case "distance":
      return mode === "geo"
        ? "ORDER BY distance_m ASC"
        : "ORDER BY adresse_reference ASC";
    case "lots":
      return "ORDER BY nb_lots_habitation DESC NULLS LAST, id ASC";
    case "pertinence":
    default:
      if (mode === "geo") return "ORDER BY distance_m ASC";
      if (mode === "postal") return "ORDER BY adresse_reference ASC";
      return "ORDER BY score_global DESC NULLS LAST, id ASC";
  }
}

async function geocode(q: string): Promise<{ lon: number; lat: number; feature: BanFeature } | null> {
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=1`
    );
    const data = await res.json();
    const feature = data.features?.[0] as BanFeature | undefined;
    if (!feature) return null;
    const [lon, lat] = feature.geometry.coordinates;
    return { lon, lat, feature };
  } catch {
    return null;
  }
}

async function searchByRadius(
  lon: number,
  lat: number,
  sort: SortKey,
  limit: number,
  offset: number
): Promise<CoproRow[]> {
  const dLat = RADIUS_METERS * LAT_PER_METER;
  const dLon = RADIUS_METERS * LON_PER_METER;
  const order = buildOrderClause(sort, "geo");

  return prisma.$queryRawUnsafe<CoproRow[]>(
    `SELECT ${SELECT_COLS},
            (6371000 * acos(
              LEAST(1.0, cos(radians($1)) * cos(radians(latitude)) *
              cos(radians(longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(latitude)))
            )) AS distance_m
     FROM coproprietes
     WHERE latitude BETWEEN $1 - $3 AND $1 + $3
       AND longitude BETWEEN $2 - $4 AND $2 + $4
       AND latitude IS NOT NULL AND longitude IS NOT NULL
     ${order}
     LIMIT $5 OFFSET $6`,
    lat, lon, dLat, dLon, limit, offset
  );
}

async function countByRadius(lon: number, lat: number): Promise<number> {
  const dLat = RADIUS_METERS * LAT_PER_METER;
  const dLon = RADIUS_METERS * LON_PER_METER;

  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*) as count
     FROM coproprietes
     WHERE latitude BETWEEN $1 - $3 AND $1 + $3
       AND longitude BETWEEN $2 - $4 AND $2 + $4
       AND latitude IS NOT NULL AND longitude IS NOT NULL`,
    lat, lon, dLat, dLon
  );
  return Number(rows[0]?.count ?? 0);
}

async function searchByPostalCode(
  code: string,
  sort: SortKey,
  limit: number,
  offset: number
): Promise<{ rows: CoproRow[]; total: number }> {
  const order = buildOrderClause(sort, "postal");

  const [rows, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<CoproRow[]>(
      `SELECT ${SELECT_COLS},
              NULL::double precision AS distance_m
       FROM coproprietes
       WHERE code_postal = $1
       ${order}
       LIMIT $2 OFFSET $3`,
      code, limit, offset
    ),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM coproprietes WHERE code_postal = $1`,
      code
    ),
  ]);

  return { rows, total: Number(countRows[0]?.count ?? 0) };
}

async function searchByText(q: string, sort: SortKey, limit: number, offset: number): Promise<{ rows: CoproRow[]; total: number }> {
  const words = q.toLowerCase().replace(/[^a-z0-9àâäéèêëïîôùûüÿçœæ\s-]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return { rows: [], total: 0 };

  const postalCode = words.find((w) => /^\d{5}$/.test(w));
  const textWords = words.filter((w) => !/^\d{5}$/.test(w));

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIdx = 1;

  for (const w of textWords) {
    conditions.push(
      `(LOWER(adresse_reference) LIKE $${paramIdx} OR LOWER(commune_adresse) LIKE $${paramIdx})`
    );
    params.push(`%${w}%`);
    paramIdx++;
  }

  if (postalCode) {
    conditions.push(`code_postal = $${paramIdx}`);
    params.push(postalCode);
    paramIdx++;
  }

  if (conditions.length === 0) return { rows: [], total: 0 };

  const where = conditions.join(" AND ");
  const order = buildOrderClause(sort, "text");

  const limitParam = paramIdx;
  const offsetParam = paramIdx + 1;

  const [rows, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<CoproRow[]>(
      `SELECT ${SELECT_COLS},
              NULL::double precision AS distance_m
       FROM coproprietes
       WHERE ${where}
       ${order}
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      ...params, limit, offset
    ),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM coproprietes WHERE ${where}`,
      ...params
    ),
  ]);

  return { rows, total: Number(countRows[0]?.count ?? 0) };
}

function mapRow(row: CoproRow) {
  return {
    id: row.id,
    slug: row.slug,
    adresse: row.adresse_reference,
    commune: row.commune_adresse,
    codePostal: row.code_postal,
    nomUsage: row.nom_usage,
    scoreGlobal: row.score_global,
    nbLots: row.nb_lots_habitation,
    longitude: row.longitude,
    latitude: row.latitude,
    distance: row.distance_m !== null ? Math.round(Number(row.distance_m)) : null,
    typeSyndic: row.type_syndic,
    periodeConstruction: row.periode_construction,
  };
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const paramLat = sp.get("lat");
  const paramLon = sp.get("lon");
  const sort = (sp.get("sort") as SortKey) || "pertinence";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") || "20", 10) || 20));
  const offset = (page - 1) * limit;

  // Validate sort
  const validSorts: SortKey[] = ["pertinence", "score_desc", "score_asc", "distance", "lots"];
  const safeSort: SortKey = validSorts.includes(sort) ? sort : "pertinence";

  if ((!q || q.length < 2) && !paramLat) {
    return NextResponse.json({ results: [], total: 0 });
  }

  // Postal code direct search
  if (q && /^\d{5}$/.test(q)) {
    const { rows, total } = await searchByPostalCode(q, safeSort, limit, offset);
    return NextResponse.json({ results: rows.map(mapRow), total });
  }

  // Determine coordinates
  let lat: number | null = paramLat ? parseFloat(paramLat) : null;
  let lon: number | null = paramLon ? parseFloat(paramLon) : null;

  if (lat === null && q) {
    const geo = await geocode(q);
    if (geo) {
      lat = geo.lat;
      lon = geo.lon;
    }
  }

  // Geo search
  if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
    const total = await countByRadius(lon, lat);

    if (total > 0) {
      const rows = await searchByRadius(lon, lat, safeSort, limit, offset);
      return NextResponse.json({ results: rows.map(mapRow), total });
    }
  }

  // Text fallback (only when geo returned 0)
  if (q) {
    const { rows, total } = await searchByText(q, safeSort, limit, offset);
    return NextResponse.json({ results: rows.map(mapRow), total });
  }

  return NextResponse.json({ results: [], total: 0 });
}
