import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();
const RADIUS_M = 500;
const LAT_PER_M = 1 / 111320;
const LON_PER_M = 1 / 77370;
const BATCH_SIZE = 500;

async function main() {
  console.log("Calculating market data for copropriétés (500m radius from DVF)...");
  const startTime = Date.now();

  // Pre-compute: for performance, we'll do a single large SQL update per batch
  // using a lateral join approach
  let cursor: number | undefined;
  let processed = 0;
  let withData = 0;

  const dLat = RADIUS_M * LAT_PER_M;
  const dLon = RADIUS_M * LON_PER_M;

  while (true) {
    // Fetch a batch of copropriétés with coordinates
    const copros = await prisma.copropriete.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      where: { latitude: { not: null }, longitude: { not: null } },
      select: { id: true, longitude: true, latitude: true },
    });

    if (copros.length === 0) break;

    // For each copro, compute market metrics via raw SQL
    const updates: string[] = [];
    const prixUpdates: string[] = [];
    const evoUpdates: string[] = [];
    const nbTxUpdates: string[] = [];
    const ids: number[] = [];

    for (const c of copros) {
      const lat = c.latitude!;
      const lon = c.longitude!;

      // Get all transactions in radius
      const rows = await prisma.$queryRawUnsafe<
        Array<{ prix: number; surface: number; date_mutation: Date }>
      >(
        `SELECT prix, surface, date_mutation
         FROM dvf_transactions
         WHERE latitude BETWEEN $1 - $3 AND $1 + $3
           AND longitude BETWEEN $2 - $4 AND $2 + $4
           AND latitude IS NOT NULL AND longitude IS NOT NULL
           AND surface > 0`,
        lat, lon, dLat, dLon
      );

      if (rows.length === 0) continue;

      // Prix moyen au m²
      let totalPrix = 0;
      let totalSurface = 0;
      const recentPrixM2: number[] = []; // last 12 months
      const olderPrixM2: number[] = [];  // 12-36 months ago
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());

      for (const r of rows) {
        const pm2 = r.prix / r.surface;
        totalPrix += r.prix;
        totalSurface += r.surface;

        const d = new Date(r.date_mutation);
        if (d >= oneYearAgo) {
          recentPrixM2.push(pm2);
        } else if (d >= threeYearsAgo) {
          olderPrixM2.push(pm2);
        }
      }

      const avgPrixM2 = Math.round(totalPrix / totalSurface);
      const nbTransactions = rows.length;

      // Evolution: compare recent avg vs older avg (annualized)
      let evolution: number | null = null;
      if (recentPrixM2.length >= 2 && olderPrixM2.length >= 2) {
        const avgRecent = recentPrixM2.reduce((a, b) => a + b, 0) / recentPrixM2.length;
        const avgOlder = olderPrixM2.reduce((a, b) => a + b, 0) / olderPrixM2.length;
        if (avgOlder > 0) {
          // Simple annualized percentage change
          const totalChange = (avgRecent - avgOlder) / avgOlder;
          evolution = Math.round(totalChange * 100 * 10) / 10; // e.g. -5.3%
        }
      }

      ids.push(c.id);
      prixUpdates.push(`WHEN ${c.id} THEN ${avgPrixM2}`);
      evoUpdates.push(`WHEN ${c.id} THEN ${evolution ?? "NULL"}`);
      nbTxUpdates.push(`WHEN ${c.id} THEN ${nbTransactions}`);
      withData++;
    }

    if (ids.length > 0) {
      const idList = ids.join(",");
      await prisma.$executeRawUnsafe(`
        UPDATE coproprietes SET
          marche_prix_m2 = CASE id ${prixUpdates.join(" ")} END,
          marche_evolution = CASE id ${evoUpdates.join(" ")} END,
          marche_nb_transactions = CASE id ${nbTxUpdates.join(" ")} END
        WHERE id IN (${idList})
      `);
    }

    cursor = copros[copros.length - 1].id;
    processed += copros.length;

    if (processed % 10_000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ${processed.toLocaleString()} copros processed, ${withData.toLocaleString()} with market data (${elapsed}s)`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nMarket data: ${processed.toLocaleString()} processed, ${withData.toLocaleString()} with data (${elapsed}s)`);

  // Stats
  const stats = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT
      count(*) FILTER (WHERE marche_prix_m2 IS NOT NULL) AS with_market_data,
      round(avg(marche_prix_m2)::numeric, 0) AS avg_prix_m2,
      round(avg(marche_evolution)::numeric, 1) AS avg_evolution,
      round(avg(marche_nb_transactions)::numeric, 0) AS avg_nb_tx
    FROM coproprietes
    WHERE marche_prix_m2 IS NOT NULL
  `);
  console.log("Market stats:", stats[0]);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
