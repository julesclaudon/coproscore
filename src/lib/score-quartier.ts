import { prisma } from "./prisma";

export interface ScoreQuartier {
  scoreMoyen: number;
  scoreMedian: number;
  nbCopros: number;
  pctBon: number;      // score >= 70
  pctMoyen: number;    // 40 <= score < 70
  pctAttention: number; // score < 40
  rayon: number;
}

const LAT_PER_METER = 1 / 111320;
const LON_PER_METER = 1 / 77370;

interface QuartierRow {
  nb_copros: bigint;
  score_moyen: number;
  score_median: number;
  nb_bon: bigint;
  nb_moyen: bigint;
  nb_attention: bigint;
}

export async function getScoreQuartier(
  lat: number,
  lng: number,
  rayon: number = 300
): Promise<ScoreQuartier | null> {
  const dLat = rayon * LAT_PER_METER;
  const dLon = rayon * LON_PER_METER;

  const rows = await prisma.$queryRawUnsafe<QuartierRow[]>(
    `SELECT
      COUNT(*) AS nb_copros,
      ROUND(AVG(score_global)::numeric, 1) AS score_moyen,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score_global) AS score_median,
      COUNT(*) FILTER (WHERE score_global >= 70) AS nb_bon,
      COUNT(*) FILTER (WHERE score_global >= 40 AND score_global < 70) AS nb_moyen,
      COUNT(*) FILTER (WHERE score_global < 40) AS nb_attention
    FROM coproprietes
    WHERE latitude BETWEEN $1 - $3 AND $1 + $3
      AND longitude BETWEEN $2 - $4 AND $2 + $4
      AND score_global IS NOT NULL
      AND latitude IS NOT NULL
      AND (6371000 * acos(
        LEAST(1.0, cos(radians($1)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians($2)) +
        sin(radians($1)) * sin(radians(latitude)))
      )) <= $5`,
    lat,
    lng,
    dLat,
    dLon,
    rayon
  );

  if (!rows[0] || Number(rows[0].nb_copros) === 0) return null;

  const r = rows[0];
  const total = Number(r.nb_copros);

  return {
    scoreMoyen: Number(r.score_moyen),
    scoreMedian: Math.round(Number(r.score_median)),
    nbCopros: total,
    pctBon: Math.round((Number(r.nb_bon) / total) * 100),
    pctMoyen: Math.round((Number(r.nb_moyen) / total) * 100),
    pctAttention: Math.round((Number(r.nb_attention) / total) * 100),
    rayon,
  };
}
