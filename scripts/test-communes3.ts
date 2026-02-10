import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  // Test the MODE() approach for commune name
  const rows = await prisma.$queryRawUnsafe<{ nom: string; nom_dept: string; code_dept: string }[]>(
    `SELECT 
       MODE() WITHIN GROUP (ORDER BY UPPER(nom_officiel_commune)) as nom,
       MODE() WITHIN GROUP (ORDER BY nom_officiel_departement) as nom_dept,
       MODE() WITHIN GROUP (ORDER BY code_officiel_departement) as code_dept
     FROM coproprietes 
     WHERE code_officiel_commune = $1 
       AND nom_officiel_commune IS NOT NULL 
       AND nom_officiel_commune != 'null'`,
    "75056"
  );
  console.log("Paris MODE():", rows[0]);

  // Test INITCAP approach
  const rows2 = await prisma.$queryRawUnsafe<{ nom: string }[]>(
    `SELECT INITCAP(nom_officiel_commune) as nom, COUNT(*) as cnt
     FROM coproprietes 
     WHERE code_officiel_commune = $1 
       AND nom_officiel_commune IS NOT NULL 
       AND nom_officiel_commune != 'null'
       AND nom_officiel_commune !~ '^\d'
       AND LENGTH(nom_officiel_commune) <= 30
     GROUP BY INITCAP(nom_officiel_commune)
     ORDER BY cnt DESC LIMIT 1`,
    "75056"
  );
  console.log("Paris best name:", rows2[0]);

  // Test for Lyon, Marseille, Nice
  for (const code of ["69123", "13055", "06088", "31555"]) {
    const r = await prisma.$queryRawUnsafe<{ nom: string; cnt: bigint }[]>(
      `SELECT INITCAP(nom_officiel_commune) as nom, COUNT(*) as cnt
       FROM coproprietes 
       WHERE code_officiel_commune = $1 
         AND nom_officiel_commune IS NOT NULL 
         AND nom_officiel_commune != 'null'
         AND nom_officiel_commune !~ '^\d'
         AND LENGTH(nom_officiel_commune) <= 30
       GROUP BY INITCAP(nom_officiel_commune)
       ORDER BY cnt DESC LIMIT 1`,
      code
    );
    console.log(`${code}: ${r[0]?.nom} (${r[0]?.cnt})`);
  }

  // How many copros total for Paris?
  const total = await prisma.$queryRawUnsafe<{ cnt: bigint }[]>(
    `SELECT COUNT(*) as cnt FROM coproprietes WHERE code_officiel_commune = $1`,
    "75056"
  );
  console.log(`\nParis total copros: ${total[0].cnt}`);

  await prisma.$disconnect();
}

main().catch(console.error);
