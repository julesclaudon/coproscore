import "dotenv/config";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();
const CSV_PATH = process.env.DPE_CSV ?? `${__dirname}/../../dpe_logements.csv`;
const BATCH_SIZE = 2000;
const VALID_CLASSES = new Set(["A", "B", "C", "D", "E", "F", "G"]);

function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function parseFloat_(v: string): number | null {
  if (!v) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function str(v: string): string | null {
  if (!v) return null;
  return v.trim() || null;
}

async function main() {
  console.log(`Importing DPE from: ${CSV_PATH}`);
  const startTime = Date.now();

  let batch: Array<{
    numeroDpe: string;
    dateDpe: Date | null;
    classeDpe: string | null;
    classeGes: string | null;
    codePostal: string | null;
    codeInsee: string | null;
    adresse: string | null;
    longitude: number | null;
    latitude: number | null;
    numeroImmatriculationCopropriete: string | null;
  }> = [];
  let total = 0;
  let skipped = 0;

  const parser = createReadStream(CSV_PATH).pipe(
    parse({
      columns: true,
      delimiter: ",",
      quote: '"',
      skip_empty_lines: true,
      relax_column_count: true,
    })
  );

  for await (const row of parser) {
    const classeDpe = str(row.etiquette_dpe);

    // Skip rows without a valid DPE class
    if (!classeDpe || !VALID_CLASSES.has(classeDpe)) {
      skipped++;
      continue;
    }

    const lon = parseFloat_(row.coordonnee_cartographique_x_ban);
    const lat = parseFloat_(row.coordonnee_cartographique_y_ban);

    // Skip zero coordinates (0,0 = no geocode)
    const longitude = lon && lon !== 0 ? lon : null;
    const latitude = lat && lat !== 0 ? lat : null;

    batch.push({
      numeroDpe: row.numero_dpe || `unknown_${total}`,
      dateDpe: parseDate(row.date_etablissement_dpe),
      classeDpe,
      classeGes: str(row.etiquette_ges),
      codePostal: str(row.code_postal_ban),
      codeInsee: str(row.code_insee_ban),
      adresse: str(row.adresse_ban),
      longitude,
      latitude,
      numeroImmatriculationCopropriete: str(row.numero_immatriculation_copropriete),
    });

    if (batch.length >= BATCH_SIZE) {
      await prisma.dpeLogement.createMany({ data: batch, skipDuplicates: true });
      total += batch.length;
      batch = [];
      if (total % 200_000 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  ${total.toLocaleString()} rows (${elapsed}s)`);
      }
    }
  }

  if (batch.length > 0) {
    await prisma.dpeLogement.createMany({ data: batch, skipDuplicates: true });
    total += batch.length;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${total.toLocaleString()} DPE imported, ${skipped.toLocaleString()} skipped (${elapsed}s)`);

  const stats = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE longitude IS NOT NULL) AS geocoded,
      count(*) FILTER (WHERE numero_immatriculation_copropriete IS NOT NULL) AS with_copro_id,
      classe_dpe, count(*) AS nb
    FROM dpe_logements
    GROUP BY classe_dpe
    ORDER BY classe_dpe
  `);
  console.log("\nDistribution:");
  for (const s of stats) {
    console.log(`  ${s.classe_dpe}: ${s.nb}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
