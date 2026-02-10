import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePdfReport, type ReportInput } from "@/lib/pdf-report";
import { getOrGenerateAnalyse } from "@/lib/generate-analyse";
import { formatCoproName } from "@/lib/utils";
import { formatPeriod } from "@/lib/format";
import {
  detailedTechnique,
  detailedRisques,
  detailedGouvernance,
  detailedEnergie,
  detailedMarche,
} from "@/lib/score-explanations";
import { fetchDvfTransactions } from "@/lib/dvf-queries";
import { estimerBudgetTravaux } from "@/lib/budget-travaux";
import { buildTimeline, type DpeForTimeline } from "@/lib/timeline";

const LAT_PER_METER = 1 / 111320;
const LON_PER_METER = 1 / 77370;
const RADIUS = 500;

// ─── Data fetching ────────────────────────────────────────────────────────────

interface NearbyRow {
  id: number;
  slug: string | null;
  adresse_reference: string | null;
  commune_adresse: string | null;
  nom_usage: string | null;
  score_global: number | null;
  nb_lots_habitation: number | null;
  distance_m: number;
}

async function fetchNearby(
  coproId: number,
  lon: number,
  lat: number
): Promise<NearbyRow[]> {
  const dLat = RADIUS * LAT_PER_METER;
  const dLon = RADIUS * LON_PER_METER;
  return prisma.$queryRawUnsafe<NearbyRow[]>(
    `SELECT id, slug, adresse_reference, commune_adresse, nom_usage,
            score_global, nb_lots_habitation,
            (6371000 * acos(
              LEAST(1.0, cos(radians($1)) * cos(radians(latitude)) *
              cos(radians(longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(latitude)))
            )) AS distance_m
     FROM coproprietes
     WHERE latitude BETWEEN $1 - $3 AND $1 + $3
       AND longitude BETWEEN $2 - $4 AND $2 + $4
       AND latitude IS NOT NULL AND longitude IS NOT NULL
       AND id != $5
     ORDER BY distance_m ASC
     LIMIT 20`,
    lat,
    lon,
    dLat,
    dLon,
    coproId
  );
}

async function fetchCommuneAvgPrix(
  codeCommune: string
): Promise<number | null> {
  const rows = await prisma.$queryRawUnsafe<{ avg_prix: number | null }[]>(
    `SELECT round(avg(marche_prix_m2)::numeric, 0) as avg_prix
     FROM coproprietes
     WHERE code_officiel_commune = $1 AND marche_prix_m2 IS NOT NULL`,
    codeCommune
  );
  return rows[0]?.avg_prix ?? null;
}

// ─── Timeline helpers ─────────────────────────────────────────────────────────

const TIMELINE_DVF_RADIUS = 100;

async function fetchTimelineDvf(lon: number, lat: number) {
  const dLat = TIMELINE_DVF_RADIUS * LAT_PER_METER;
  const dLon = TIMELINE_DVF_RADIUS * LON_PER_METER;
  return prisma.$queryRawUnsafe<import("@/lib/dvf-queries").DvfRow[]>(
    `SELECT id, date_mutation, prix, surface, nb_pieces, adresse,
            round((prix / surface)::numeric, 0)::int AS prix_m2
     FROM dvf_transactions
     WHERE latitude BETWEEN $1 - $3 AND $1 + $3
       AND longitude BETWEEN $2 - $4 AND $2 + $4
       AND surface > 0
     ORDER BY date_mutation DESC
     LIMIT 10`,
    lat, lon, dLat, dLon
  );
}

async function fetchTimelineDpe(
  numeroImmatriculation: string,
  lon: number | null,
  lat: number | null
): Promise<DpeForTimeline[]> {
  const byImmat = await prisma.$queryRawUnsafe<DpeForTimeline[]>(
    `SELECT date_dpe AS "dateDpe", classe_dpe AS "classeDpe"
     FROM dpe_logements
     WHERE numero_immatriculation_copropriete = $1
       AND date_dpe IS NOT NULL
     ORDER BY date_dpe DESC
     LIMIT 10`,
    numeroImmatriculation
  );
  if (byImmat.length > 0) return byImmat;
  if (lat == null || lon == null) return [];
  const dLat = 50 * LAT_PER_METER;
  const dLon = 50 * LON_PER_METER;
  return prisma.$queryRawUnsafe<DpeForTimeline[]>(
    `SELECT date_dpe AS "dateDpe", classe_dpe AS "classeDpe"
     FROM dpe_logements
     WHERE latitude BETWEEN $1 - $3 AND $1 + $3
       AND longitude BETWEEN $2 - $4 AND $2 + $4
       AND date_dpe IS NOT NULL
     ORDER BY date_dpe DESC
     LIMIT 10`,
    lat, lon, dLat, dLon
  );
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
 try {
  const { slug } = await params;

  const copro = await prisma.copropriete.findUnique({ where: { slug } });
  if (!copro || copro.scoreGlobal == null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hasCoords = copro.longitude != null && copro.latitude != null;

  // Fetch all data in parallel
  const [analyseResult, transactions, nearby, communeAvgPrix, timelineDvf, timelineDpe] =
    await Promise.all([
      getOrGenerateAnalyse(copro).catch(() => null),
      hasCoords
        ? fetchDvfTransactions(copro.longitude!, copro.latitude!, 30)
        : Promise.resolve([]),
      hasCoords
        ? fetchNearby(copro.id, copro.longitude!, copro.latitude!)
        : Promise.resolve([] as NearbyRow[]),
      copro.codeOfficielCommune
        ? fetchCommuneAvgPrix(copro.codeOfficielCommune)
        : Promise.resolve(null),
      hasCoords
        ? fetchTimelineDvf(copro.longitude!, copro.latitude!)
        : Promise.resolve([]),
      fetchTimelineDpe(copro.numeroImmatriculation, copro.longitude, copro.latitude),
    ]);

  const displayName = formatCoproName(
    copro.nomUsage || copro.adresseReference || "Copropri\u00e9t\u00e9"
  );

  const dimensions = [
    {
      label: "Technique",
      score: copro.scoreTechnique,
      max: 25,
      detailedExplanation: detailedTechnique(copro),
    },
    {
      label: "Risques",
      score: copro.scoreRisques,
      max: 30,
      detailedExplanation: detailedRisques(copro),
    },
    {
      label: "Gouvernance",
      score: copro.scoreGouvernance,
      max: 25,
      detailedExplanation: detailedGouvernance(copro),
    },
    {
      label: "\u00c9nergie",
      score: copro.scoreEnergie,
      max: 20,
      detailedExplanation: detailedEnergie(copro),
    },
    {
      label: "March\u00e9",
      score: copro.scoreMarche,
      max: 20,
      detailedExplanation: detailedMarche(copro),
    },
  ];

  const input: ReportInput = {
    displayName,
    address: copro.adresseReference ?? "Adresse inconnue",
    codePostal: copro.codePostal ?? "",
    commune: copro.communeAdresse ?? "",
    slug,

    scoreGlobal: copro.scoreGlobal,
    scoreTechnique: copro.scoreTechnique,
    scoreRisques: copro.scoreRisques,
    scoreGouvernance: copro.scoreGouvernance,
    scoreEnergie: copro.scoreEnergie,
    scoreMarche: copro.scoreMarche,
    indiceConfiance: copro.indiceConfiance,

    nbTotalLots: copro.nbTotalLots,
    nbLotsHabitation: copro.nbLotsHabitation,
    typeSyndic: copro.typeSyndic,
    periodeConstruction: copro.periodeConstruction,
    syndicatCooperatif: copro.syndicatCooperatif,
    dpeClasseMediane: copro.dpeClasseMediane,

    dimensions,

    analyse: analyseResult?.analyse ?? null,
    analyseDate: analyseResult
      ? new Date(analyseResult.generatedAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null,

    marchePrixM2: copro.marchePrixM2,
    marcheEvolution: copro.marcheEvolution,
    marcheNbTransactions: copro.marcheNbTransactions,
    communeAvgPrix,
    communeLabel:
      copro.nomOfficielArrondissement || copro.communeAdresse || "",

    transactions: transactions.map((t) => ({
      date: new Date(t.date_mutation).toLocaleDateString("fr-FR"),
      adresse: t.adresse ?? "\u2014",
      surface: Number(t.surface),
      prix: Number(t.prix),
      prixM2: Number(t.prix_m2),
    })),

    nearby: nearby.map((n) => ({
      name: formatCoproName(
        n.nom_usage || n.adresse_reference || "Copropri\u00e9t\u00e9"
      ),
      commune: n.commune_adresse,
      score: n.score_global,
      nbLots: n.nb_lots_habitation,
      distance: Number(n.distance_m),
    })),

    estimation: estimerBudgetTravaux({
      periodeConstruction: copro.periodeConstruction,
      nbLotsHabitation: copro.nbLotsHabitation,
      dpeClasseMediane: copro.dpeClasseMediane,
      coproDansPdp: copro.coproDansPdp,
    }),

    timeline: buildTimeline(
      {
        periodeConstruction: copro.periodeConstruction,
        dateImmatriculation: copro.dateImmatriculation,
        dateDerniereMaj: copro.dateDerniereMaj,
        dateReglementCopropriete: copro.dateReglementCopropriete,
        dateFinDernierMandat: copro.dateFinDernierMandat,
        coproDansPdp: copro.coproDansPdp,
        typeSyndic: copro.typeSyndic,
      },
      timelineDvf,
      timelineDpe
    ),
  };

  const pdfBuffer = await generatePdfReport(input);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport-coproscore-${slug}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
 } catch (err) {
  console.error("[rapport] Error generating PDF:", err);
  return NextResponse.json(
    { error: "Erreur lors de la génération du rapport" },
    { status: 500 }
  );
 }
}
