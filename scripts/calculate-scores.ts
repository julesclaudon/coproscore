import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { calculateScore } from "../src/lib/scoring.js";

const prisma = new PrismaClient();
const BATCH_SIZE = 5000;

async function main() {
  console.log("Calculating scores v2 for all copropriétés (5 dimensions, /120→100)...");
  const startTime = Date.now();

  let cursor: number | undefined;
  let processed = 0;

  while (true) {
    const rows = await prisma.copropriete.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: {
        id: true,
        periodeConstruction: true,
        coproDansPdp: true,
        typeSyndic: true,
        syndicatCooperatif: true,
        nbTotalLots: true,
        marcheEvolution: true,
        marcheNbTransactions: true,
        dpeClasseMediane: true,
      },
    });

    if (rows.length === 0) break;

    const cases = {
      scoreGlobal: [] as string[],
      scoreTechnique: [] as string[],
      scoreRisques: [] as string[],
      scoreGouvernance: [] as string[],
      scoreEnergie: [] as string[],
      scoreMarche: [] as string[],
      indiceConfiance: [] as string[],
    };
    const ids: number[] = [];

    for (const row of rows) {
      const result = calculateScore({
        periodeConstruction: row.periodeConstruction,
        coproDansPdp: row.coproDansPdp,
        typeSyndic: row.typeSyndic,
        syndicatCooperatif: row.syndicatCooperatif,
        nbLots: row.nbTotalLots,
        marcheEvolution: row.marcheEvolution,
        marcheNbTransactions: row.marcheNbTransactions,
        dpe: row.dpeClasseMediane,
      });

      ids.push(row.id);
      cases.scoreGlobal.push(`WHEN ${row.id} THEN ${result.scoreGlobal}`);
      cases.scoreTechnique.push(`WHEN ${row.id} THEN ${result.scoreTechnique}`);
      cases.scoreRisques.push(`WHEN ${row.id} THEN ${result.scoreRisques}`);
      cases.scoreGouvernance.push(`WHEN ${row.id} THEN ${result.scoreGouvernance}`);
      cases.scoreEnergie.push(`WHEN ${row.id} THEN ${result.scoreEnergie}`);
      cases.scoreMarche.push(`WHEN ${row.id} THEN ${result.scoreMarche}`);
      cases.indiceConfiance.push(`WHEN ${row.id} THEN ${result.indiceConfiance}`);
    }

    const idList = ids.join(",");
    await prisma.$executeRawUnsafe(`
      UPDATE coproprietes SET
        score_global = CASE id ${cases.scoreGlobal.join(" ")} END,
        score_technique = CASE id ${cases.scoreTechnique.join(" ")} END,
        score_risques = CASE id ${cases.scoreRisques.join(" ")} END,
        score_gouvernance = CASE id ${cases.scoreGouvernance.join(" ")} END,
        score_energie = CASE id ${cases.scoreEnergie.join(" ")} END,
        score_marche = CASE id ${cases.scoreMarche.join(" ")} END,
        indice_confiance = CASE id ${cases.indiceConfiance.join(" ")} END
      WHERE id IN (${idList})
    `);

    cursor = rows[rows.length - 1].id;
    processed += rows.length;

    if (processed % 50_000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ${processed.toLocaleString()} rows scored (${elapsed}s)`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${processed.toLocaleString()} rows scored in ${elapsed}s`);

  // Stats
  const stats = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT
      round(avg(score_global)::numeric, 1) as avg_score,
      min(score_global) as min_score,
      max(score_global) as max_score,
      round(avg(score_technique)::numeric, 1) as avg_technique,
      round(avg(score_risques)::numeric, 1) as avg_risques,
      round(avg(score_gouvernance)::numeric, 1) as avg_gouvernance,
      round(avg(score_energie)::numeric, 1) as avg_energie,
      round(avg(score_marche)::numeric, 1) as avg_marche,
      round(avg(indice_confiance)::numeric, 1) as avg_confiance,
      count(*) FILTER (WHERE score_global > 85) as excellent,
      count(*) FILTER (WHERE score_global > 70 AND score_global <= 85) as bon,
      count(*) FILTER (WHERE score_global > 55 AND score_global <= 70) as moyen,
      count(*) FILTER (WHERE score_global >= 40 AND score_global <= 55) as passable,
      count(*) FILTER (WHERE score_global < 40) as attention
    FROM coproprietes
    WHERE score_global IS NOT NULL
  `);

  console.log("\n=== Scoring v2 Statistics ===");
  const s = stats[0];
  console.log(`Global: avg=${s.avg_score} | min=${s.min_score} | max=${s.max_score}`);
  console.log(`Technique: avg=${s.avg_technique} | Risques: avg=${s.avg_risques} | Gouvernance: avg=${s.avg_gouvernance}`);
  console.log(`Énergie: avg=${s.avg_energie} | Marché: avg=${s.avg_marche}`);
  console.log(`Confiance moyenne: ${s.avg_confiance}%`);
  console.log(`\nDistribution:`);
  console.log(`  >85 (Excellent) : ${s.excellent}`);
  console.log(`  70-85 (Bon)     : ${s.bon}`);
  console.log(`  55-70 (Moyen)   : ${s.moyen}`);
  console.log(`  40-55 (Passable): ${s.passable}`);
  console.log(`  <40 (Attention) : ${s.attention}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
