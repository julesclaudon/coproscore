import { writeFileSync, appendFileSync, existsSync, statSync } from "fs";

const OUTPUT = process.env.DPE_OUTPUT ?? `${__dirname}/../../dpe_logements.csv`;
const SELECT = "numero_dpe,date_etablissement_dpe,etiquette_dpe,etiquette_ges,code_postal_ban,code_insee_ban,adresse_ban,coordonnee_cartographique_x_ban,coordonnee_cartographique_y_ban,numero_immatriculation_copropriete";
const HEADER = "numero_dpe,date_etablissement_dpe,etiquette_dpe,etiquette_ges,code_postal_ban,code_insee_ban,adresse_ban,coordonnee_cartographique_x_ban,coordonnee_cartographique_y_ban,numero_immatriculation_copropriete";
const PAGE_SIZE = 10000;
const CONCURRENCY = 4;

// Resume: skip first N departments (env var or CLI arg)
const SKIP = parseInt(process.env.SKIP_DEPTS ?? process.argv[2] ?? "0", 10);

const DEPARTMENTS = [
  "01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19",
  "2A","2B","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37",
  "38","39","40","41","42","43","44","45","46","47","48","49","50","51","52","53","54","55","56",
  "57","58","59","60","61","62","63","64","65","66","67","68","69","70","71","72","73","74","75",
  "76","77","78","79","80","81","82","83","84","85","86","87","88","89","90","91","92","93","94",
  "95","971","972","973","974","976"
];

interface DpeRow {
  numero_dpe?: string;
  date_etablissement_dpe?: string;
  etiquette_dpe?: string;
  etiquette_ges?: string;
  code_postal_ban?: string;
  code_insee_ban?: string;
  adresse_ban?: string;
  coordonnee_cartographique_x_ban?: number;
  coordonnee_cartographique_y_ban?: number;
  numero_immatriculation_copropriete?: string;
}

function escCsv(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function rowToCsv(r: DpeRow): string {
  return [
    escCsv(r.numero_dpe), escCsv(r.date_etablissement_dpe), escCsv(r.etiquette_dpe),
    escCsv(r.etiquette_ges), escCsv(r.code_postal_ban), escCsv(r.code_insee_ban),
    escCsv(r.adresse_ban), escCsv(r.coordonnee_cartographique_x_ban),
    escCsv(r.coordonnee_cartographique_y_ban), escCsv(r.numero_immatriculation_copropriete),
  ].join(",");
}

async function fetchPage(url: string, retries = 4): Promise<{ results: DpeRow[]; next: string | null }> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { results: data.results ?? [], next: data.next ?? null };
    } catch (e) {
      if (i === retries - 1) throw e;
      const wait = 3000 * (i + 1);
      console.warn(`  Retry ${i + 1} after ${wait}ms: ${(e as Error).message}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  return { results: [], next: null };
}

async function downloadDepartment(dept: string): Promise<number> {
  let count = 0;
  let url: string | null =
    `https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines?size=${PAGE_SIZE}&select=${SELECT}&qs=code_departement_ban:"${dept}"`;

  while (url) {
    const { results, next } = await fetchPage(url);
    if (results.length === 0) break;
    const lines = results.map(rowToCsv);
    appendFileSync(OUTPUT, lines.join("\n") + "\n");
    count += results.length;
    url = next;
  }

  return count;
}

async function main() {
  const remaining = DEPARTMENTS.slice(SKIP);
  console.log(`Downloading DPE (depts ${SKIP + 1}-${DEPARTMENTS.length}, ${remaining.length} remaining, ${CONCURRENCY} parallel)...`);
  const startTime = Date.now();

  // If starting fresh, write header; if resuming, just append
  if (SKIP === 0) {
    writeFileSync(OUTPUT, HEADER + "\n");
  } else {
    if (!existsSync(OUTPUT)) {
      writeFileSync(OUTPUT, HEADER + "\n");
    }
    console.log(`  Resuming: appending to existing file`);
  }

  let totalRows = 0;
  let deptsDone = 0;

  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    const chunk = remaining.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map((d) => downloadDepartment(d)));

    for (const count of results) {
      totalRows += count;
    }

    deptsDone += chunk.length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const deptLabels = chunk.join(",");
    console.log(`  ${SKIP + deptsDone}/${DEPARTMENTS.length} depts [${deptLabels}]: ${totalRows.toLocaleString()} new rows (${elapsed}s)`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${totalRows.toLocaleString()} new rows in ${elapsed}s`);
  console.log(`Saved to: ${OUTPUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
