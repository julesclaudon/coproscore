import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { makeCoproSlug } from "../src/lib/slug.js";

const prisma = new PrismaClient();

interface CoproRow {
  id: number;
  adresse_reference: string | null;
  code_postal: string | null;
}

async function main() {
  console.log("Fetching all copropriétés...");

  const rows = await prisma.$queryRawUnsafe<CoproRow[]>(
    `SELECT id, adresse_reference, code_postal FROM coproprietes ORDER BY id`
  );

  console.log(`  ${rows.length} rows fetched`);
  console.log("Generating unique slugs...");

  const usedSlugs = new Set<string>();
  const updates: { id: number; slug: string }[] = [];
  let collisions = 0;

  for (const row of rows) {
    let slug = makeCoproSlug(row.adresse_reference, row.code_postal);
    if (usedSlugs.has(slug)) {
      collisions++;
      let counter = 2;
      while (usedSlugs.has(`${slug}-${counter}`)) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }
    usedSlugs.add(slug);
    updates.push({ id: row.id, slug });
  }

  console.log(`  ${updates.length} slugs generated (${collisions} collisions resolved)`);

  // Batch update with CASE/WHEN
  const BATCH = 5000;
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    const ids = batch.map((u) => u.id);
    const cases = batch
      .map((u) => `WHEN ${u.id} THEN '${u.slug.replace(/'/g, "''")}'`)
      .join(" ");

    await prisma.$executeRawUnsafe(
      `UPDATE coproprietes SET slug = CASE id ${cases} END WHERE id IN (${ids.join(",")})`
    );

    if ((i + BATCH) % 50000 < BATCH) {
      console.log(`  updated ${Math.min(i + BATCH, updates.length)}/${updates.length}...`);
    }
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
