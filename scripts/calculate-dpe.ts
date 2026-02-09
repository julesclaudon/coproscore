import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();
const RADIUS_M = 50;
const LAT_PER_M = 1 / 111320;
const LON_PER_M = 1 / 77370;
const BATCH_SIZE = 500;
const DPE_ORDER = ["A", "B", "C", "D", "E", "F", "G"];

function medianClass(classes: string[]): string {
  const sorted = classes
    .map((c) => DPE_ORDER.indexOf(c))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  if (sorted.length === 0) return "D"; // fallback
  const mid = Math.floor(sorted.length / 2);
  return DPE_ORDER[sorted[mid]];
}

function distribution(classes: string[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const c of classes) {
    if (DPE_ORDER.includes(c)) {
      dist[c] = (dist[c] || 0) + 1;
    }
  }
  return dist;
}

async function main() {
  console.log("Matching DPE to copropriétés...");
  const startTime = Date.now();

  const dLat = RADIUS_M * LAT_PER_M;
  const dLon = RADIUS_M * LON_PER_M;

  let cursor: number | undefined;
  let processed = 0;
  let withDpe = 0;
  let directMatch = 0;

  while (true) {
    const copros = await prisma.copropriete.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true, longitude: true, latitude: true, numeroImmatriculation: true },
    });

    if (copros.length === 0) break;

    const classeUpdates: string[] = [];
    const nbUpdates: string[] = [];
    const distUpdates: string[] = [];
    const ids: number[] = [];

    for (const c of copros) {
      let dpeClasses: string[] = [];

      // Strategy 1: Direct match by numero_immatriculation_copropriete
      const directDpes = await prisma.$queryRawUnsafe<Array<{ classe_dpe: string }>>(
        `SELECT classe_dpe FROM dpe_logements
         WHERE numero_immatriculation_copropriete = $1
           AND classe_dpe IS NOT NULL
         LIMIT 200`,
        c.numeroImmatriculation
      );

      if (directDpes.length > 0) {
        dpeClasses = directDpes.map((d) => d.classe_dpe);
        directMatch++;
      }
      // Strategy 2: Geo-proximity (50m radius)
      else if (c.latitude != null && c.longitude != null) {
        const geoDpes = await prisma.$queryRawUnsafe<Array<{ classe_dpe: string }>>(
          `SELECT classe_dpe FROM dpe_logements
           WHERE latitude BETWEEN $1 - $3 AND $1 + $3
             AND longitude BETWEEN $2 - $4 AND $2 + $4
             AND latitude IS NOT NULL AND longitude IS NOT NULL
             AND classe_dpe IS NOT NULL
           LIMIT 200`,
          c.latitude, c.longitude, dLat, dLon
        );
        dpeClasses = geoDpes.map((d) => d.classe_dpe);
      }

      if (dpeClasses.length === 0) continue;

      const median = medianClass(dpeClasses);
      const dist = distribution(dpeClasses);
      const distJson = JSON.stringify(dist).replace(/'/g, "''");

      ids.push(c.id);
      classeUpdates.push(`WHEN ${c.id} THEN '${median}'`);
      nbUpdates.push(`WHEN ${c.id} THEN ${dpeClasses.length}`);
      distUpdates.push(`WHEN ${c.id} THEN '${distJson}'`);
      withDpe++;
    }

    if (ids.length > 0) {
      const idList = ids.join(",");
      await prisma.$executeRawUnsafe(`
        UPDATE coproprietes SET
          dpe_classe_mediane = CASE id ${classeUpdates.join(" ")} END,
          dpe_nb_logements = CASE id ${nbUpdates.join(" ")} END,
          dpe_distribution = CASE id ${distUpdates.join(" ")} END
        WHERE id IN (${idList})
      `);
    }

    cursor = copros[copros.length - 1].id;
    processed += copros.length;

    if (processed % 10_000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ${processed.toLocaleString()} copros, ${withDpe.toLocaleString()} with DPE (${directMatch} direct) (${elapsed}s)`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${processed.toLocaleString()} processed, ${withDpe.toLocaleString()} with DPE (${directMatch} direct match) (${elapsed}s)`);

  const stats = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT dpe_classe_mediane, count(*) AS nb
    FROM coproprietes
    WHERE dpe_classe_mediane IS NOT NULL
    GROUP BY dpe_classe_mediane
    ORDER BY dpe_classe_mediane
  `);
  console.log("\nMedian DPE distribution across copros:");
  for (const s of stats) console.log(`  ${s.dpe_classe_mediane}: ${s.nb}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
