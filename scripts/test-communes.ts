import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  const queries = [
    { label: "Paris (75056)", code: "75056" },
    { label: "Paris 1er (75101)", code: "75101" },
    { label: "Paris 17e (75117)", code: "75117" },
    { label: "Lyon (69123)", code: "69123" },
    { label: "Lyon 3e (69383)", code: "69383" },
    { label: "Marseille (13055)", code: "13055" },
    { label: "Marseille 6e (13206)", code: "13206" },
    { label: "Toulouse (31555)", code: "31555" },
    { label: "Nice (06088)", code: "06088" },
    { label: "Non-existent (99999)", code: "99999" },
  ];

  for (const q of queries) {
    const rows = await prisma.$queryRawUnsafe<{ nom: string | null; cnt: bigint }[]>(
      `SELECT nom_officiel_commune as nom, COUNT(*) as cnt
       FROM coproprietes WHERE code_officiel_commune = $1
       GROUP BY nom_officiel_commune`,
      q.code
    );
    if (rows.length === 0) {
      console.log(`${q.label}: NO DATA`);
    } else {
      console.log(`${q.label}: nom="${rows[0].nom}", count=${rows[0].cnt}`);
    }
  }

  // Find a small commune
  const small = await prisma.$queryRawUnsafe<{ code: string; nom: string; cnt: bigint }[]>(
    `SELECT code_officiel_commune as code, nom_officiel_commune as nom, COUNT(*) as cnt
     FROM coproprietes
     WHERE code_officiel_commune IS NOT NULL AND nom_officiel_commune IS NOT NULL
     GROUP BY code_officiel_commune, nom_officiel_commune
     HAVING COUNT(*) BETWEEN 1 AND 3
     ORDER BY RANDOM() LIMIT 3`
  );
  for (const s of small) {
    console.log(`Small commune: code=${s.code}, nom="${s.nom}", count=${s.cnt}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
