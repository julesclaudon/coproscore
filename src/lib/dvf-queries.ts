import { prisma } from "@/lib/prisma";

export interface DvfRow {
  id: number;
  date_mutation: Date;
  prix: number;
  surface: number;
  nb_pieces: number | null;
  adresse: string | null;
  prix_m2: number;
}

export interface DvfQuarterlyRow {
  year: number;
  quarter: number;
  avg_prix_m2: number;
}

const DVF_RADIUS = 500;
const LAT_PER_METER = 1 / 111320;
const LON_PER_METER = 1 / 77370;

export async function fetchDvfTransactions(
  lon: number,
  lat: number,
  limit = 5000
): Promise<DvfRow[]> {
  const dLat = DVF_RADIUS * LAT_PER_METER;
  const dLon = DVF_RADIUS * LON_PER_METER;
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  return prisma.$queryRawUnsafe<DvfRow[]>(
    `SELECT id, date_mutation, prix, surface, nb_pieces, adresse,
            round((prix / surface)::numeric, 0)::int AS prix_m2
     FROM dvf_transactions
     WHERE latitude BETWEEN $1 - $3 AND $1 + $3
       AND longitude BETWEEN $2 - $4 AND $2 + $4
       AND surface >= 9
       AND date_mutation >= $5
     ORDER BY date_mutation DESC
     LIMIT $6`,
    lat,
    lon,
    dLat,
    dLon,
    threeYearsAgo,
    limit
  );
}

export async function fetchDvfQuarterlyAvg(
  lon: number,
  lat: number
): Promise<DvfQuarterlyRow[]> {
  const dLat = DVF_RADIUS * LAT_PER_METER;
  const dLon = DVF_RADIUS * LON_PER_METER;
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  return prisma.$queryRawUnsafe<DvfQuarterlyRow[]>(
    `SELECT EXTRACT(YEAR FROM date_mutation)::int AS year,
            EXTRACT(QUARTER FROM date_mutation)::int AS quarter,
            round(avg(prix / surface)::numeric, 0)::int AS avg_prix_m2
     FROM dvf_transactions
     WHERE latitude BETWEEN $1 - $3 AND $1 + $3
       AND longitude BETWEEN $2 - $4 AND $2 + $4
       AND surface >= 9
       AND date_mutation >= $5
     GROUP BY year, quarter
     ORDER BY year ASC, quarter ASC`,
    lat,
    lon,
    dLat,
    dLon,
    threeYearsAgo
  );
}
