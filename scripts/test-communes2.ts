import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  // What codes do Paris copros use?
  console.log("=== Paris code_officiel_commune values ===");
  const parisCodes = await prisma.$queryRawUnsafe<{ code: string; nom: string | null; cnt: bigint }[]>(
    `SELECT code_officiel_commune as code, nom_officiel_commune as nom, COUNT(*) as cnt
     FROM coproprietes
     WHERE code_postal LIKE '75%' AND code_officiel_commune IS NOT NULL
     GROUP BY code_officiel_commune, nom_officiel_commune
     ORDER BY cnt DESC LIMIT 25`
  );
  for (const r of parisCodes) {
    console.log(`  code=${r.code}, nom="${r.nom}", count=${r.cnt}`);
  }

  // What about code_postal for Paris?
  console.log("\n=== Paris by code_postal ===");
  const parisPostal = await prisma.$queryRawUnsafe<{ cp: string; cnt: bigint }[]>(
    `SELECT code_postal as cp, COUNT(*) as cnt
     FROM coproprietes
     WHERE code_postal LIKE '75%' AND code_officiel_commune IS NOT NULL
     GROUP BY code_postal
     ORDER BY cp LIMIT 25`
  );
  for (const r of parisPostal) {
    console.log(`  cp=${r.cp}, count=${r.cnt}`);
  }

  // Check a random Paris entry
  console.log("\n=== Sample Paris rows ===");
  const samples = await prisma.$queryRawUnsafe<{ id: number; code_commune: string; nom_commune: string; code_postal: string; adresse: string }[]>(
    `SELECT id, code_officiel_commune as code_commune, nom_officiel_commune as nom_commune,
            code_postal, adresse_reference as adresse
     FROM coproprietes
     WHERE code_postal LIKE '750%'
     LIMIT 5`
  );
  for (const r of samples) {
    console.log(`  id=${r.id}, code_commune="${r.code_commune}", nom="${r.nom_commune}", cp=${r.code_postal}, addr="${r.adresse}"`);
  }

  // Check Lyon
  console.log("\n=== Lyon code_officiel_commune values ===");
  const lyonCodes = await prisma.$queryRawUnsafe<{ code: string; nom: string | null; cnt: bigint }[]>(
    `SELECT code_officiel_commune as code, nom_officiel_commune as nom, COUNT(*) as cnt
     FROM coproprietes
     WHERE code_postal LIKE '690%'
     GROUP BY code_officiel_commune, nom_officiel_commune
     ORDER BY cnt DESC LIMIT 15`
  );
  for (const r of lyonCodes) {
    console.log(`  code=${r.code}, nom="${r.nom}", count=${r.cnt}`);
  }

  // Top communes by count
  console.log("\n=== Top 15 communes by copro count ===");
  const topCommunes = await prisma.$queryRawUnsafe<{ code: string; nom: string | null; cnt: bigint }[]>(
    `SELECT code_officiel_commune as code, nom_officiel_commune as nom, COUNT(*) as cnt
     FROM coproprietes
     WHERE code_officiel_commune IS NOT NULL
     GROUP BY code_officiel_commune, nom_officiel_commune
     ORDER BY cnt DESC LIMIT 15`
  );
  for (const r of topCommunes) {
    console.log(`  code=${r.code}, nom="${r.nom}", count=${r.cnt}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
