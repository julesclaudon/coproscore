import "dotenv/config";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

const CSV_PATH = process.env.CSV_PATH ?? `${__dirname}/../../rnic_2025_oct.csv`;
const BATCH_SIZE = 1000;

function parseDate(value: string): Date | null {
  if (!value || value === "non connu") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function parseInt_(value: string): number | null {
  if (!value || value === "non connu") return null;
  const n = parseInt(value, 10);
  return isNaN(n) ? null : n;
}

function parseFloat_(value: string): number | null {
  if (!value || value === "non connu") return null;
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

function str(value: string): string | null {
  if (!value || value === "non connu") return null;
  return value.trim() || null;
}

interface CsvRow {
  epci: string;
  commune: string;
  numero_d_immatriculation: string;
  date_d_immatriculation: string;
  date_de_la_derniere_maj: string;
  type_de_syndic_benevole_professionnel_non_connu: string;
  identification_du_representant_legal_raison_sociale_et_le_numer: string;
  raison_sociale_du_representant_legal: string;
  siret_du_representant_legal: string;
  code_ape: string;
  commune_du_representant_legal: string;
  mandat_en_cours_dans_la_copropriete: string;
  date_de_fin_du_dernier_mandat: string;
  nom_d_usage_de_la_copropriete: string;
  adresse_de_reference: string;
  numero_et_voie_adresse_de_reference: string;
  code_postal_adresse_de_reference: string;
  commune_adresse_de_reference: string;
  adresse_complementaire_1: string;
  adresse_complementaire_2: string;
  adresse_complementaire_3: string;
  nombre_d_adresses_complementaires: string;
  long: string;
  lat: string;
  date_du_reglement_de_copropriete: string;
  residence_service: string;
  syndicat_cooperatif: string;
  syndicat_principal_ou_syndicat_secondaire: string;
  si_secondaire_n_d_immatriculation_du_principal: string;
  nombre_d_asl_auxquelles_est_rattache_le_syndicat_de_coproprieta: string;
  nombre_d_aful_auxquelles_est_rattache_le_syndicat_de_copropriet: string;
  nombre_d_unions_de_syndicats_auxquelles_est_rattache_le_syndica: string;
  nombre_total_de_lots: string;
  nombre_total_de_lots_a_usage_d_habitation_de_bureaux_ou_de_comm: string;
  nombre_de_lots_a_usage_d_habitation: string;
  nombre_de_lots_de_stationnement: string;
  periode_de_construction: string;
  reference_cadastrale_1: string;
  code_insee_commune_1: string;
  prefixe_1: string;
  section_1: string;
  numero_parcelle_1: string;
  reference_cadastrale_2: string;
  code_insee_commune_2: string;
  prefixe_2: string;
  section_2: string;
  numero_parcelle_2: string;
  reference_cadastrale_3: string;
  code_insee_commune_3: string;
  prefixe_3: string;
  section_3: string;
  numero_parcelle_3: string;
  nombre_de_parcelles_cadastrales: string;
  nom_qp_2015: string;
  code_qp_2015: string;
  nom_qp_2024: string;
  code_qp_2024: string;
  copro_dans_acv: string;
  copro_dans_pvd: string;
  code_de_pdp: string;
  copro_dans_pdp: string;
  copro_aidee: string;
  code_officiel_commune: string;
  nom_officiel_commune: string;
  code_officiel_arrondissement_commune: string;
  nom_officiel_arrondissement_commune: string;
  code_officiel_epci: string;
  nom_officiel_epci: string;
  code_officiel_departement: string;
  nom_officiel_departement: string;
  code_officiel_region: string;
  nom_officiel_region: string;
}

function mapRow(row: CsvRow) {
  return {
    numeroImmatriculation: row.numero_d_immatriculation,
    dateImmatriculation: parseDate(row.date_d_immatriculation),
    dateDerniereMaj: parseDate(row.date_de_la_derniere_maj),
    typeSyndic: str(row.type_de_syndic_benevole_professionnel_non_connu),
    identificationRepresentantLegal: str(row.identification_du_representant_legal_raison_sociale_et_le_numer),
    raisonSocialeRepresentantLegal: str(row.raison_sociale_du_representant_legal),
    siretRepresentantLegal: str(row.siret_du_representant_legal),
    codeApe: str(row.code_ape),
    communeRepresentantLegal: str(row.commune_du_representant_legal),
    mandatEnCours: str(row.mandat_en_cours_dans_la_copropriete),
    dateFinDernierMandat: parseDate(row.date_de_fin_du_dernier_mandat),
    nomUsage: str(row.nom_d_usage_de_la_copropriete),
    adresseReference: str(row.adresse_de_reference),
    numeroVoie: str(row.numero_et_voie_adresse_de_reference),
    codePostal: str(row.code_postal_adresse_de_reference),
    communeAdresse: str(row.commune_adresse_de_reference),
    adresseComplementaire1: str(row.adresse_complementaire_1),
    adresseComplementaire2: str(row.adresse_complementaire_2),
    adresseComplementaire3: str(row.adresse_complementaire_3),
    nbAdressesComplementaires: parseInt_(row.nombre_d_adresses_complementaires),
    longitude: parseFloat_(row.long),
    latitude: parseFloat_(row.lat),
    dateReglementCopropriete: parseDate(row.date_du_reglement_de_copropriete),
    residenceService: str(row.residence_service),
    syndicatCooperatif: str(row.syndicat_cooperatif),
    syndicatType: str(row.syndicat_principal_ou_syndicat_secondaire),
    immatriculationPrincipal: str(row.si_secondaire_n_d_immatriculation_du_principal),
    nbAsl: parseInt_(row.nombre_d_asl_auxquelles_est_rattache_le_syndicat_de_coproprieta),
    nbAful: parseInt_(row.nombre_d_aful_auxquelles_est_rattache_le_syndicat_de_copropriet),
    nbUnionsSyndicats: parseInt_(row.nombre_d_unions_de_syndicats_auxquelles_est_rattache_le_syndica),
    nbTotalLots: parseInt_(row.nombre_total_de_lots),
    nbLotsHabBurCom: parseInt_(row.nombre_total_de_lots_a_usage_d_habitation_de_bureaux_ou_de_comm),
    nbLotsHabitation: parseInt_(row.nombre_de_lots_a_usage_d_habitation),
    nbLotsStationnement: parseInt_(row.nombre_de_lots_de_stationnement),
    periodeConstruction: str(row.periode_de_construction),
    refCadastrale1: str(row.reference_cadastrale_1),
    codeInseeCommune1: str(row.code_insee_commune_1),
    prefixe1: str(row.prefixe_1),
    section1: str(row.section_1),
    numeroParcelle1: str(row.numero_parcelle_1),
    refCadastrale2: str(row.reference_cadastrale_2),
    codeInseeCommune2: str(row.code_insee_commune_2),
    prefixe2: str(row.prefixe_2),
    section2: str(row.section_2),
    numeroParcelle2: str(row.numero_parcelle_2),
    refCadastrale3: str(row.reference_cadastrale_3),
    codeInseeCommune3: str(row.code_insee_commune_3),
    prefixe3: str(row.prefixe_3),
    section3: str(row.section_3),
    numeroParcelle3: str(row.numero_parcelle_3),
    nbParcellesCadastrales: parseInt_(row.nombre_de_parcelles_cadastrales),
    nomQp2015: str(row.nom_qp_2015),
    codeQp2015: str(row.code_qp_2015),
    nomQp2024: str(row.nom_qp_2024),
    codeQp2024: str(row.code_qp_2024),
    coproDansAcv: str(row.copro_dans_acv),
    coproDansPvd: str(row.copro_dans_pvd),
    codePdp: str(row.code_de_pdp),
    coproDansPdp: parseInt_(row.copro_dans_pdp),
    coproAidee: str(row.copro_aidee),
    codeOfficielCommune: str(row.code_officiel_commune),
    nomOfficielCommune: str(row.nom_officiel_commune),
    codeOfficielArrondissement: str(row.code_officiel_arrondissement_commune),
    nomOfficielArrondissement: str(row.nom_officiel_arrondissement_commune),
    codeOfficielEpci: str(row.code_officiel_epci),
    nomOfficielEpci: str(row.nom_officiel_epci),
    codeOfficielDepartement: str(row.code_officiel_departement),
    nomOfficielDepartement: str(row.nom_officiel_departement),
    codeOfficielRegion: str(row.code_officiel_region),
    nomOfficielRegion: str(row.nom_officiel_region),
    epci: str(row.epci),
    commune: str(row.commune),
  };
}

async function flushBatch(batch: ReturnType<typeof mapRow>[]) {
  await prisma.copropriete.createMany({ data: batch, skipDuplicates: true });
}

async function main() {
  console.log(`Importing RNIC from: ${CSV_PATH}`);
  const startTime = Date.now();

  let batch: ReturnType<typeof mapRow>[] = [];
  let total = 0;
  let errors = 0;

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
    try {
      batch.push(mapRow(row as CsvRow));
    } catch (e) {
      errors++;
      if (errors <= 5) console.error(`Row error at line ~${total + 1}:`, e);
      continue;
    }

    if (batch.length >= BATCH_SIZE) {
      await flushBatch(batch);
      total += batch.length;
      batch = [];
      if (total % 50_000 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`  ${total.toLocaleString()} rows imported (${elapsed}s)`);
      }
    }
  }

  if (batch.length > 0) {
    await flushBatch(batch);
    total += batch.length;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${total.toLocaleString()} rows imported in ${elapsed}s`);
  if (errors > 0) console.log(`${errors} rows skipped due to errors`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
