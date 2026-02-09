import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RADIUS_METERS = 100;
// At ~46°N (France center): 1° lat ≈ 111320m, 1° lon ≈ 77370m
const LAT_PER_METER = 1 / 111320;
const LON_PER_METER = 1 / 77370;

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
  distance_m: number | null;
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

async function searchByRadius(lon: number, lat: number): Promise<CoproRow[]> {
  const dLat = RADIUS_METERS * LAT_PER_METER;
  const dLon = RADIUS_METERS * LON_PER_METER;

  return prisma.$queryRawUnsafe<CoproRow[]>(
    `SELECT id, slug, adresse_reference, commune_adresse, code_postal, nom_usage,
            score_global, nb_lots_habitation,
            (6371000 * acos(
              LEAST(1.0, cos(radians($1)) * cos(radians(latitude)) *
              cos(radians(longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(latitude)))
            )) AS distance_m
     FROM coproprietes
     WHERE latitude BETWEEN $1 - $3 AND $1 + $3
       AND longitude BETWEEN $2 - $4 AND $2 + $4
       AND latitude IS NOT NULL AND longitude IS NOT NULL
     ORDER BY distance_m ASC
     LIMIT 30`,
    lat, lon, dLat, dLon
  );
}

async function searchByText(q: string): Promise<CoproRow[]> {
  // Extract words, try to find a postal code pattern
  const words = q.toLowerCase().replace(/[^a-z0-9àâäéèêëïîôùûüÿçœæ\s-]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const postalCode = words.find((w) => /^\d{5}$/.test(w));
  const textWords = words.filter((w) => !/^\d{5}$/.test(w));

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIdx = 1;

  // Each text word must match adresse_reference or commune_adresse
  for (const w of textWords) {
    conditions.push(
      `(LOWER(adresse_reference) LIKE $${paramIdx} OR LOWER(commune_adresse) LIKE $${paramIdx})`
    );
    params.push(`%${w}%`);
    paramIdx++;
  }

  // If we found a postal code, require it
  if (postalCode) {
    conditions.push(`code_postal = $${paramIdx}`);
    params.push(postalCode);
    paramIdx++;
  }

  if (conditions.length === 0) return [];

  return prisma.$queryRawUnsafe<CoproRow[]>(
    `SELECT id, slug, adresse_reference, commune_adresse, code_postal, nom_usage,
            score_global, nb_lots_habitation,
            NULL::double precision AS distance_m
     FROM coproprietes
     WHERE ${conditions.join(" AND ")}
     ORDER BY score_global DESC NULLS LAST
     LIMIT 20`,
    ...params
  );
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  const paramLat = request.nextUrl.searchParams.get("lat");
  const paramLon = request.nextUrl.searchParams.get("lon");

  if ((!q || q.length < 3) && !paramLat) {
    return NextResponse.json({ results: [] });
  }

  let geoResults: CoproRow[] = [];
  let textResults: CoproRow[] = [];

  // Determine coordinates: from params or from BAN geocoding
  let lat: number | null = paramLat ? parseFloat(paramLat) : null;
  let lon: number | null = paramLon ? parseFloat(paramLon) : null;

  if (lat === null && q) {
    const geo = await geocode(q);
    if (geo) {
      lat = geo.lat;
      lon = geo.lon;
    }
  }

  // Search by radius if we have coordinates
  if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
    geoResults = await searchByRadius(lon, lat);
  }

  // ILIKE fallback on text
  if (q) {
    textResults = await searchByText(q);
  }

  // Combine and deduplicate, geo results first (sorted by distance)
  const seen = new Set<number>();
  const combined: Array<{
    id: number;
    slug: string | null;
    adresse: string | null;
    commune: string | null;
    codePostal: string | null;
    nomUsage: string | null;
    scoreGlobal: number | null;
    nbLots: number | null;
    distance: number | null;
  }> = [];

  for (const row of [...geoResults, ...textResults]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    combined.push({
      id: row.id,
      slug: row.slug,
      adresse: row.adresse_reference,
      commune: row.commune_adresse,
      codePostal: row.code_postal,
      nomUsage: row.nom_usage,
      scoreGlobal: row.score_global,
      nbLots: row.nb_lots_habitation,
      distance: row.distance_m !== null ? Math.round(Number(row.distance_m)) : null,
    });
  }

  return NextResponse.json({ results: combined.slice(0, 30) });
}
