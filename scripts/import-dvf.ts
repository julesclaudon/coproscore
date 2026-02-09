import "dotenv/config";
import { createReadStream } from "fs";
import { createGunzip } from "zlib";
import { parse } from "csv-parse";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();
const BATCH_SIZE = 2000;
const DVF_DIR = process.env.DVF_DIR ?? `${__dirname}/../../dvf`;
const YEARS = ["2023", "2024", "2025"];

interface DvfRow {
  id_mutation: string;
  date_mutation: string;
  nature_mutation: string;
  valeur_fonciere: string;
  type_local: string;
  surface_reelle_bati: string;
  nombre_pieces_principales: string;
  code_postal: string;
  code_commune: string;
  adresse_numero: string;
  adresse_nom_voie: string;
  longitude: string;
  latitude: string;
}

function parseFloat_(v: string): number | null {
  if (!v) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function parseInt_(v: string): number | null {
  if (!v) return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

async function importYear(year: string) {
  const filePath = `${DVF_DIR}/${year}.csv.gz`;
  console.log(`\nImporting ${year} from ${filePath}...`);
  const startTime = Date.now();

  let batch: Array<{
    idMutation: string;
    dateMutation: Date;
    prix: number;
    surface: number | null;
    nbPieces: number | null;
    codePostal: string | null;
    codeCommune: string | null;
    adresse: string | null;
    longitude: number | null;
    latitude: number | null;
  }> = [];
  let total = 0;
  let skipped = 0;

  const parser = createReadStream(filePath)
    .pipe(createGunzip())
    .pipe(
      parse({
        columns: true,
        delimiter: ",",
        quote: '"',
        skip_empty_lines: true,
        relax_column_count: true,
      })
    );

  for await (const row of parser) {
    const r = row as DvfRow;

    // Filter: only "Vente" of "Appartement" with a price and surface
    if (r.nature_mutation !== "Vente") continue;
    if (r.type_local !== "Appartement") continue;

    const prix = parseFloat_(r.valeur_fonciere);
    const surface = parseFloat_(r.surface_reelle_bati);
    if (!prix || prix <= 0) continue;
    if (!surface || surface <= 0) continue;

    // Skip outliers (< 500€/m² or > 30000€/m²)
    const prixM2 = prix / surface;
    if (prixM2 < 500 || prixM2 > 30000) {
      skipped++;
      continue;
    }

    const adresseNum = r.adresse_numero?.trim() || "";
    const adresseVoie = r.adresse_nom_voie?.trim() || "";
    const adresse = [adresseNum, adresseVoie].filter(Boolean).join(" ") || null;

    batch.push({
      idMutation: r.id_mutation,
      dateMutation: new Date(r.date_mutation),
      prix,
      surface,
      nbPieces: parseInt_(r.nombre_pieces_principales),
      codePostal: r.code_postal || null,
      codeCommune: r.code_commune || null,
      adresse,
      longitude: parseFloat_(r.longitude),
      latitude: parseFloat_(r.latitude),
    });

    if (batch.length >= BATCH_SIZE) {
      await prisma.dvfTransaction.createMany({ data: batch, skipDuplicates: true });
      total += batch.length;
      batch = [];
      if (total % 100_000 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  ${total.toLocaleString()} rows (${elapsed}s)`);
      }
    }
  }

  if (batch.length > 0) {
    await prisma.dvfTransaction.createMany({ data: batch, skipDuplicates: true });
    total += batch.length;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ${year}: ${total.toLocaleString()} apartments imported, ${skipped} outliers skipped (${elapsed}s)`);
  return total;
}

async function main() {
  console.log("Importing DVF apartment transactions...");
  const startTime = Date.now();
  let grandTotal = 0;

  for (const year of YEARS) {
    grandTotal += await importYear(year);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${grandTotal.toLocaleString()} total apartment transactions in ${elapsed}s`);

  // Quick stats
  const stats = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT
      count(*) AS total,
      round(avg(prix / NULLIF(surface, 0))::numeric, 0) AS avg_prix_m2,
      min(date_mutation) AS min_date,
      max(date_mutation) AS max_date,
      count(*) FILTER (WHERE longitude IS NOT NULL) AS geocoded
    FROM dvf_transactions
  `);
  console.log("\nStats:", stats[0]);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
