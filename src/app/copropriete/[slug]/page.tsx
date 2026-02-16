import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { ScoreGauge } from "./score-gauge";
import { DpeDistribution } from "./dpe-distribution";
import { CoproMap } from "./copro-map";
import { formatCoproName } from "@/lib/utils";
import { getAccessLevel, type AccessLevel } from "@/lib/access";
import { formatPeriod } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/footer";
import {
  Building2,
  MapPin,
  FileText,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Wrench,
  ShieldCheck,
  Users,
  Zap,
  Hash,
  Home,
  Info,
  Lock,
  Download,
} from "lucide-react";
import {
  detailedTechnique,
  detailedRisques,
  detailedGouvernance,
  detailedEnergie,
  detailedMarche,
} from "@/lib/score-explanations";
import { Sparkline } from "./sparkline";
import { AnalyseIA } from "./analyse-ia";
import { DownloadButton } from "./download-button";
import { SaveHistory } from "@/components/save-history";
import { Header } from "@/components/header";
import { AlertModal } from "./alert-modal";
import { FavoriteButton } from "./favorite-button";
import { ShareButton } from "./share-button";
import { EstimationTravauxSection } from "./estimation-travaux";
import { estimerBudgetTravaux } from "@/lib/budget-travaux";
import { ScoreQuartierSection } from "./score-quartier";
import { getScoreQuartier } from "@/lib/score-quartier";
import { TimelineSection } from "./timeline-section";
import { buildTimeline, type DpeForTimeline } from "@/lib/timeline";
import {
  fetchDvfTransactions,
  fetchDvfQuarterlyAvg,
  type DvfRow,
  type DvfQuarterlyRow,
} from "@/lib/dvf-queries";
import { PaywallOverlay } from "@/components/paywall-overlay";
import { AutoDownload } from "./auto-download";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dynamic — session-based access control
export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

// ---------- SEO Metadata ----------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Numeric IDs and RNIC identifiers will be redirected by the page function
  if (/^\d+$/.test(slug) || !slug.includes("-")) return {};

  const copro = await prisma.copropriete.findUnique({
    where: { slug },
    select: {
      adresseReference: true,
      codePostal: true,
      communeAdresse: true,
      scoreGlobal: true,
      nbLotsHabitation: true,
      scoreTechnique: true,
      scoreRisques: true,
      scoreGouvernance: true,
      scoreEnergie: true,
      scoreMarche: true,
      typeSyndic: true,
    },
  });
  if (!copro) return {};

  const adresse = copro.adresseReference ?? "Adresse inconnue";
  const ville = [copro.codePostal, copro.communeAdresse].filter(Boolean).join(" ");
  const scoreText = copro.scoreGlobal != null ? `Score ${copro.scoreGlobal}/100` : "";
  const lotsText = copro.nbLotsHabitation != null ? `${copro.nbLotsHabitation} lots` : "";
  const details = [scoreText, lotsText, copro.typeSyndic ? `syndic ${copro.typeSyndic.toLowerCase()}` : ""]
    .filter(Boolean)
    .join(", ");
  const dimensionText = [
    copro.scoreTechnique != null ? `Technique ${copro.scoreTechnique}/25` : "",
    copro.scoreRisques != null ? `Risques ${copro.scoreRisques}/30` : "",
    copro.scoreGouvernance != null ? `Gouvernance ${copro.scoreGouvernance}/25` : "",
    copro.scoreEnergie != null ? `Énergie ${copro.scoreEnergie}/20` : "",
    copro.scoreMarche != null ? `Marché ${copro.scoreMarche}/20` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const displayName = formatCoproName(adresse);
  const ogTitle = copro.scoreGlobal != null
    ? `${displayName} — Score ${copro.scoreGlobal}/100`
    : displayName;

  const ogImage = `${process.env.NEXT_PUBLIC_BASE_URL || "https://coproscore.fr"}/api/og/copropriete/${slug}`;

  const title = copro.scoreGlobal != null
    ? `${displayName} — Score ${copro.scoreGlobal}/100`
    : `${displayName} — Score copropriété`;

  const descParts = [`Score détaillé de ${displayName} à ${ville}`];
  if (dimensionText) descParts.push(dimensionText);
  if (details) descParts.push(details);
  const description = descParts.join(". ") + ".";

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: `Score détaillé de ${displayName} à ${ville} : technique, risques, gouvernance, énergie, marché.`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: `Score détaillé de ${displayName} à ${ville}. ${details}.`,
      images: [ogImage],
    },
  };
}

// ---------- Helpers ----------

function scoreColorClass(score: number | null) {
  if (score === null) return "text-slate-400";
  if (score >= 70) return "text-teal-600";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

function scoreLabel(score: number | null) {
  if (score === null) return "Non calculé";
  if (score >= 70) return "Bon";
  if (score >= 40) return "Moyen";
  return "Attention requise";
}

function formatPrix(n: number): string {
  return n.toLocaleString("fr-FR") + " €";
}

function formatEvolution(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return sign + n.toFixed(1) + " %";
}

function slugifyInline(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

// ---------- Mini Gauge SVG ----------

function MiniGauge({ score, max, size = 40 }: { score: number | null; max: number; size?: number }) {
  const value = score ?? 0;
  const pct = value / max;
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - pct * c;
  const color = score !== null ? (pct >= 0.7 ? "#0D9488" : pct >= 0.4 ? "#F59E0B" : "#EF4444") : "#cbd5e1";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label={score !== null ? `${score} sur ${max}` : "Non disponible"}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

// ---------- Dimension explanations ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CoproData = any;

function techniqueExplanation(copro: CoproData): string {
  const period = formatPeriod(copro.periodeConstruction);
  if (period) return `Immeuble construit ${period}`;
  return "Période de construction non renseignée";
}

function risquesExplanation(copro: CoproData): string {
  if (copro.coproDansPdp && copro.coproDansPdp > 0)
    return "Copropriété en plan de prévention des risques";
  return "Aucun risque ou procédure identifié";
}

function gouvernanceExplanation(copro: CoproData): string {
  const parts: string[] = [];
  if (copro.typeSyndic) parts.push(`Syndic ${copro.typeSyndic}`);
  if (copro.syndicatCooperatif === "oui") parts.push("coopératif");
  if (copro.nbTotalLots) parts.push(`${copro.nbTotalLots} lots`);
  return parts.length > 0 ? parts.join(", ") : "Type de syndic non renseigné";
}

function energieExplanation(copro: CoproData): string {
  if (copro.dpeClasseMediane) return `DPE médian classe ${copro.dpeClasseMediane}`;
  const period = formatPeriod(copro.periodeConstruction);
  if (period) return `Pas de DPE, estimé selon période (${period})`;
  return "Aucun DPE collectif disponible";
}

function marcheExplanation(copro: CoproData): string {
  if (copro.marchePrixM2 != null) {
    const prix = formatPrix(Math.round(copro.marchePrixM2));
    if (copro.marcheEvolution != null)
      return `${prix}/m², ${formatEvolution(copro.marcheEvolution)} /an`;
    return `${prix}/m²`;
  }
  return "Données de marché insuffisantes";
}

// ---------- Data fetching ----------

interface NearbyRow {
  id: number;
  slug: string | null;
  adresse_reference: string | null;
  commune_adresse: string | null;
  code_postal: string | null;
  nom_usage: string | null;
  score_global: number | null;
  nb_lots_habitation: number | null;
  longitude: number;
  latitude: number;
  distance_m: number;
}

const NEARBY_RADIUS = 500;
const LAT_PER_METER = 1 / 111320;
const LON_PER_METER = 1 / 77370;

async function fetchNearby(coproId: number, lon: number, lat: number): Promise<NearbyRow[]> {
  const dLat = NEARBY_RADIUS * LAT_PER_METER;
  const dLon = NEARBY_RADIUS * LON_PER_METER;
  return prisma.$queryRawUnsafe<NearbyRow[]>(
    `SELECT id, slug, adresse_reference, commune_adresse, code_postal, nom_usage,
            score_global, nb_lots_habitation, longitude, latitude,
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

async function fetchCommuneAvgPrix(codeCommune: string): Promise<number | null> {
  const rows = await prisma.$queryRawUnsafe<{ avg_prix: number | null }[]>(
    `SELECT round(avg(marche_prix_m2)::numeric, 0) as avg_prix
     FROM coproprietes
     WHERE code_officiel_commune = $1 AND marche_prix_m2 IS NOT NULL`,
    codeCommune
  );
  return rows[0]?.avg_prix ?? null;
}

// Timeline helpers

const TIMELINE_DVF_RADIUS = 100;

async function fetchTimelineDvf(lon: number, lat: number): Promise<import("@/lib/dvf-queries").DvfRow[]> {
  const dLat = TIMELINE_DVF_RADIUS * LAT_PER_METER;
  const dLon = TIMELINE_DVF_RADIUS * LON_PER_METER;
  return prisma.$queryRawUnsafe<import("@/lib/dvf-queries").DvfRow[]>(
    `SELECT id, date_mutation, prix, surface, nb_pieces, adresse,
            round((prix / surface)::numeric, 0)::int AS prix_m2
     FROM dvf_transactions
     WHERE latitude BETWEEN $1 - $3 AND $1 + $3
       AND longitude BETWEEN $2 - $4 AND $2 + $4
       AND surface >= 9
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

// ---------- Access-based data slicing ----------

function getTimelineLimit(accessLevel: AccessLevel): number {
  if (accessLevel === "pro") return Infinity;
  if (accessLevel === "free") return 3;
  return 2;
}

function getDvfLimit(accessLevel: AccessLevel): number {
  if (accessLevel === "pro") return Infinity;
  if (accessLevel === "free") return 3;
  return 0; // visitor: no rows, just count
}

function getNearbyLimit(accessLevel: AccessLevel): number {
  if (accessLevel === "pro") return Infinity;
  return 3;
}

// ---------- Page Component ----------

export default async function CoproprietePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  // Numeric ID redirect (legacy links)
  if (/^\d+$/.test(slug)) {
    const numId = parseInt(slug, 10);
    const row = await prisma.copropriete.findUnique({
      where: { id: numId },
      select: { slug: true },
    });
    if (row?.slug) redirect(`/copropriete/${row.slug}`);
    notFound();
  }

  // RNIC identifier redirect (e.g. AE5707963 — no hyphens, unlike slugs)
  if (!slug.includes("-")) {
    const row = await prisma.copropriete.findUnique({
      where: { numeroImmatriculation: slug },
      select: { slug: true },
    });
    if (row?.slug) redirect(`/copropriete/${row.slug}`);
    notFound();
  }

  const copro = await prisma.copropriete.findUnique({ where: { slug } });
  if (!copro) notFound();

  const accessLevel = await getAccessLevel();

  // Check if free user has purchased this PDF
  let hasPurchased = false;
  if (accessLevel === "free") {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const purchase = await prisma.pdfPurchase.findUnique({
        where: { userId_slug: { userId: session.user.id, slug } },
      });
      hasPurchased = !!purchase;
    }
  }

  const hasCoords = copro.longitude != null && copro.latitude != null;

  const [nearby, dvfTransactions, dvfQuarterly, communeAvgPrix, scoreQuartier, timelineDvf, timelineDpe] = await Promise.all([
    hasCoords ? fetchNearby(copro.id, copro.longitude!, copro.latitude!) : Promise.resolve([]),
    hasCoords ? fetchDvfTransactions(copro.longitude!, copro.latitude!, 30) : Promise.resolve([]),
    hasCoords ? fetchDvfQuarterlyAvg(copro.longitude!, copro.latitude!) : Promise.resolve([]),
    copro.codeOfficielCommune ? fetchCommuneAvgPrix(copro.codeOfficielCommune) : Promise.resolve(null),
    hasCoords ? getScoreQuartier(copro.latitude!, copro.longitude!) : Promise.resolve(null),
    hasCoords ? fetchTimelineDvf(copro.longitude!, copro.latitude!) : Promise.resolve([]),
    fetchTimelineDpe(copro.numeroImmatriculation, copro.longitude, copro.latitude),
  ]);

  const hasMarketData = copro.marchePrixM2 != null;
  const hasDpe = copro.dpeClasseMediane != null;
  const dpeDistribution: Record<string, number> =
    hasDpe && copro.dpeDistribution ? JSON.parse(copro.dpeDistribution) : {};
  const dpeTotal = Object.values(dpeDistribution).reduce((a, b) => a + b, 0);

  const prixDiffPct =
    hasMarketData && communeAvgPrix
      ? Math.round(((copro.marchePrixM2! - communeAvgPrix) / communeAvgPrix) * 100)
      : null;

  const displayName = formatCoproName(
    copro.nomUsage || copro.adresseReference || "Copropriété"
  );
  const communeLabel = copro.nomOfficielArrondissement || copro.communeAdresse || "";
  const ARRONDISSEMENT_COMMUNES = new Set(["75056", "69123", "13055"]);
  const villeSlug =
    copro.communeAdresse && copro.codeOfficielCommune
      ? `/ville/${slugifyInline(copro.communeAdresse)}-${copro.codeOfficielCommune}${
          ARRONDISSEMENT_COMMUNES.has(copro.codeOfficielCommune) && copro.codePostal
            ? `?cp=${copro.codePostal}`
            : ""
        }`
      : null;

  const estimation = estimerBudgetTravaux({
    periodeConstruction: copro.periodeConstruction,
    nbLotsHabitation: copro.nbLotsHabitation,
    dpeClasseMediane: copro.dpeClasseMediane,
    coproDansPdp: copro.coproDansPdp,
  });

  const allTimelineEvents = buildTimeline(
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
  );

  // Slice data based on access level (server-side — data not sent to client)
  const timelineLimit = getTimelineLimit(accessLevel);
  const visibleTimeline = allTimelineEvents.slice(0, timelineLimit);
  const timelineTotalCount = allTimelineEvents.length;

  const dvfLimit = getDvfLimit(accessLevel);
  const visibleDvf = dvfTransactions.slice(0, dvfLimit);
  const dvfTotalCount = dvfTransactions.length;

  const nearbyLimit = getNearbyLimit(accessLevel);
  const visibleNearby = nearby.slice(0, nearbyLimit);

  const sparklineData = dvfQuarterly.map((q) => ({
    label: `T${q.quarter} ${q.year}`,
    value: Number(q.avg_prix_m2),
  }));

  const dimensions = [
    {
      key: "technique",
      label: "Technique",
      score: copro.scoreTechnique,
      max: 25,
      explanation: techniqueExplanation(copro),
      detailedExplanation: detailedTechnique(copro),
      icon: Wrench,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-500",
    },
    {
      key: "risques",
      label: "Risques",
      score: copro.scoreRisques,
      max: 30,
      explanation: risquesExplanation(copro),
      detailedExplanation: detailedRisques(copro),
      icon: ShieldCheck,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-500",
    },
    {
      key: "gouvernance",
      label: "Gouvernance",
      score: copro.scoreGouvernance,
      max: 25,
      explanation: gouvernanceExplanation(copro),
      detailedExplanation: detailedGouvernance(copro),
      icon: Users,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-500",
    },
    {
      key: "energie",
      label: "Énergie",
      score: copro.scoreEnergie,
      max: 20,
      explanation: energieExplanation(copro),
      detailedExplanation: detailedEnergie(copro),
      icon: Zap,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
    },
    {
      key: "marche",
      label: "Marché",
      score: copro.scoreMarche,
      max: 20,
      explanation: marcheExplanation(copro),
      detailedExplanation: detailedMarche(copro),
      icon: TrendingUp,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
    },
  ];

  const jsonLdResidence = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: displayName,
    address: {
      "@type": "PostalAddress",
      streetAddress: copro.adresseReference ?? undefined,
      postalCode: copro.codePostal ?? undefined,
      addressLocality: copro.communeAdresse ?? undefined,
      addressCountry: "FR",
    },
    ...(hasCoords && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: copro.latitude,
        longitude: copro.longitude,
      },
    }),
    additionalProperty: [
      ...(copro.scoreGlobal != null
        ? [{ "@type": "PropertyValue", name: "Score CoproScore", value: copro.scoreGlobal }]
        : []),
      ...(copro.nbTotalLots != null
        ? [{ "@type": "PropertyValue", name: "Nombre de lots", value: copro.nbTotalLots }]
        : []),
      ...(copro.typeSyndic
        ? [{ "@type": "PropertyValue", name: "Type de syndic", value: copro.typeSyndic }]
        : []),
    ],
    ...(copro.scoreGlobal != null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: +(copro.scoreGlobal / 20).toFixed(1),
        bestRating: 5,
        worstRating: 0,
        ratingCount: [copro.scoreTechnique, copro.scoreRisques, copro.scoreGouvernance, copro.scoreEnergie, copro.scoreMarche]
          .filter((v) => v != null).length,
      },
    }),
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: "https://coproscore.fr",
      },
      ...(communeLabel && villeSlug
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: communeLabel,
              item: `https://coproscore.fr${villeSlug.split("?")[0]}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: communeLabel && villeSlug ? 3 : 2,
        name: displayName,
      },
    ],
  };

  // CTA links based on access
  const dvfExportEnabled = accessLevel === "pro";
  const ctaHref = accessLevel === "visitor" ? "/inscription" : "/tarifs";
  const ctaLabel = accessLevel === "visitor" ? "Créez un compte gratuit" : "Passez Pro";

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50/50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdResidence) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      {sp.pdf === "success" && hasPurchased && <AutoDownload slug={slug} />}
      <SaveHistory
        slug={slug}
        nom={displayName}
        adresse={`${copro.adresseReference ?? ""}, ${copro.codePostal ?? ""} ${copro.communeAdresse ?? ""}`}
        score={copro.scoreGlobal}
      />
      {/* Sticky header */}
      <Header />

      {/* Hero band */}
      <section className="border-b border-t-4 border-t-teal-500 bg-gradient-to-b from-teal-50/50 to-white">
        <div className="mx-auto max-w-6xl px-3 pb-6 pt-4 sm:px-4 sm:pb-8 sm:pt-6">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 overflow-hidden text-sm text-slate-400">
            <Link href="/" className="flex shrink-0 items-center gap-1 transition-colors hover:text-teal-700">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Accueil</span>
            </Link>
            {communeLabel && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                {villeSlug ? (
                  <Link href={villeSlug} className="shrink-0 transition-colors hover:text-teal-700">
                    {communeLabel}
                  </Link>
                ) : (
                  <span className="shrink-0">{communeLabel}</span>
                )}
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-slate-600">
              {formatCoproName(copro.adresseReference || "")}
            </span>
          </nav>

          {/* Name + Score */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <h1 className="break-words text-2xl font-bold text-slate-900 sm:text-3xl">{displayName}</h1>
                <div className="flex gap-3">
                  <AlertModal slug={slug} coproName={displayName} accessLevel={accessLevel} />
                  <FavoriteButton
                    slug={slug}
                    nom={displayName}
                    adresse={copro.adresseReference || ""}
                    commune={copro.communeAdresse || ""}
                    score={copro.scoreGlobal}
                    lots={copro.nbTotalLots}
                    accessLevel={accessLevel}
                  />
                  <ShareButton
                    title={`${displayName} — Score ${copro.scoreGlobal ?? "?"}/100 | CoproScore`}
                    text={`Score de santé de ${displayName} : ${copro.scoreGlobal ?? "?"}/100`}
                  />
                </div>
              </div>
              <p className="mt-2 flex items-center gap-1.5 break-words text-slate-500">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="min-w-0">{copro.adresseReference}, {copro.codePostal} {copro.communeAdresse}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {copro.typeSyndic && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                    Syndic {copro.typeSyndic}
                  </Badge>
                )}
                {copro.nbTotalLots != null && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                    {copro.nbTotalLots} lots
                  </Badge>
                )}
                {formatPeriod(copro.periodeConstruction) && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                    Construit {formatPeriod(copro.periodeConstruction)}
                  </Badge>
                )}
                {copro.coproDansPdp != null && copro.coproDansPdp > 0 && (
                  <Badge variant="destructive">Plan de péril</Badge>
                )}
              </div>
              <Link
                href={`/comparateur?ids=${slug}`}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 transition-colors hover:text-teal-900"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Ajouter au comparateur
              </Link>
            </div>

            {copro.scoreGlobal != null && (
              <div className="flex flex-col items-center gap-1">
                <ScoreGauge score={copro.scoreGlobal} />
                <p className={`rounded-full px-3 py-0.5 text-sm font-semibold ${
                  copro.scoreGlobal >= 70
                    ? "bg-teal-100 text-teal-800"
                    : copro.scoreGlobal >= 40
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                }`}>
                  {scoreLabel(copro.scoreGlobal)}
                </p>
                {copro.indiceConfiance != null && (
                  <p className="text-xs text-slate-400">
                    Confiance : {Math.round(copro.indiceConfiance)}%
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_360px]">
            {/* ===== LEFT COLUMN ===== */}
            <div className="min-w-0 space-y-8">
              {/* --- 1. Score détaillé --- */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Score détaillé</h2>
                <div className="flex flex-col gap-3">
                  {dimensions.map((d) => {
                    const Icon = d.icon;
                    const isNull = d.score === null;
                    const pct = d.score != null ? d.score / d.max : 0;
                    const color = d.score != null
                      ? pct >= 0.7 ? "text-teal-700" : pct >= 0.4 ? "text-amber-600" : "text-red-600"
                      : "text-slate-400";
                    // Visitor: hide scores and explanations
                    const showScore = accessLevel !== "visitor";
                    const showDetail = accessLevel !== "visitor";

                    return (
                      <div
                        key={d.key}
                        className={`overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm${isNull ? " opacity-60" : ""} ${
                          !isNull && d.score != null
                            ? pct >= 0.7
                              ? "border-l-4 border-l-teal-500"
                              : pct >= 0.4
                                ? "border-l-4 border-l-amber-400"
                                : "border-l-4 border-l-red-400"
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${d.iconBg}`}>
                            <Icon className={`h-5 w-5 ${d.iconColor}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900">{d.label}</p>
                            {isNull ? (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                                <Info className="h-3 w-3" />
                                Données non disponibles
                              </p>
                            ) : (
                              <p className="mt-0.5 truncate text-xs text-slate-500">{d.explanation}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`text-lg font-bold leading-tight ${showScore ? color : "text-slate-300"}`}>
                                {showScore ? (d.score ?? "—") : "—"}
                              </p>
                              <p className="text-[10px] text-slate-400">/{d.max}</p>
                            </div>
                            {showScore ? (
                              <MiniGauge score={d.score} max={d.max} />
                            ) : (
                              <MiniGauge score={null} max={d.max} />
                            )}
                          </div>
                        </div>
                        {/* Detailed explanation */}
                        {!isNull && showDetail && (
                          <div className="mt-3">
                            <p className="break-words text-sm leading-relaxed text-slate-600">
                              {d.detailedExplanation}
                            </p>
                          </div>
                        )}
                        {/* Visitor CTA */}
                        {!isNull && !showDetail && (
                          <div className="mt-3">
                            <Link
                              href="/inscription"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
                            >
                              <Lock className="h-3.5 w-3.5 text-teal-200" />
                              Créez un compte gratuit pour voir le détail
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* --- 1b. Analyse IA --- */}
              {copro.scoreGlobal != null && accessLevel !== "visitor" && (
                <AnalyseIA slug={slug} accessLevel={accessLevel} />
              )}

              {/* --- 1c. Estimation travaux --- */}
              <EstimationTravauxSection estimation={estimation} nbLots={copro.nbLotsHabitation} accessLevel={accessLevel} />

              {/* --- 1d. Chronologie --- */}
              {timelineTotalCount > 0 && (
                <TimelineSection events={visibleTimeline} totalCount={timelineTotalCount} accessLevel={accessLevel} />
              )}

              {/* --- 2. DPE --- */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Diagnostic Énergétique
                </h2>
                <Card className="border-slate-200 bg-white">
                  <CardContent className="pt-6">
                    {!hasDpe ? (
                      <div className="py-4 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                          <Zap className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">
                          Aucun DPE collectif disponible
                        </p>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
                          Les données DPE sont issues de l'ADEME et couvrent environ 11% des
                          copropriétés. Le score énergie est estimé à
                          partir de la période de construction.
                        </p>
                      </div>
                    ) : dpeTotal === 1 ? (
                      <div className="flex items-center gap-4 py-2">
                        <DpeBadge classe={copro.dpeClasseMediane!} />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            1 diagnostic trouvé — Classe {copro.dpeClasseMediane}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            Donnée ADEME à proximité (50m)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mb-4 text-xs text-slate-400">
                          {copro.dpeNbLogements} DPE à proximité (50m) — Classe
                          médiane : <span className="font-semibold text-slate-600">{copro.dpeClasseMediane}</span>
                        </p>
                        <DpeDistribution distribution={dpeDistribution} median={copro.dpeClasseMediane!} />
                      </>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* --- 3. Marché immobilier --- */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  Marché immobilier
                </h2>
                <Card className="border-slate-200 bg-white">
                  <CardContent className="pt-6">
                    {!hasMarketData ? (
                      <div className="py-4 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                          <TrendingUp className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">
                          Données de marché insuffisantes
                        </p>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
                          Aucune transaction DVF trouvée dans un rayon de 500m sur les 3
                          dernières années.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-3 sm:gap-6">
                          <div className="text-center">
                            <p className="text-lg font-bold text-slate-900 sm:text-2xl">
                              {formatPrix(Math.round(copro.marchePrixM2!))}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">Prix moyen / m²</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {copro.marcheEvolution != null &&
                                (copro.marcheEvolution >= 0 ? (
                                  <TrendingUp className="h-3.5 w-3.5 text-teal-600 sm:h-4 sm:w-4" />
                                ) : (
                                  <TrendingDown className="h-3.5 w-3.5 text-red-500 sm:h-4 sm:w-4" />
                                ))}
                              <p
                                className={`text-lg font-bold sm:text-2xl ${
                                  copro.marcheEvolution != null
                                    ? copro.marcheEvolution >= 0
                                      ? "text-teal-700"
                                      : "text-red-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {copro.marcheEvolution != null
                                  ? formatEvolution(copro.marcheEvolution)
                                  : "—"}
                              </p>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">Évolution annuelle</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-slate-900 sm:text-2xl">
                              {copro.marcheNbTransactions ?? "—"}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">Transactions</p>
                          </div>
                        </div>

                        {prixDiffPct !== null && (
                          <div className="mt-5 overflow-hidden rounded-lg bg-slate-50 px-4 py-3">
                            <p className="break-words text-sm text-slate-600">
                              {prixDiffPct >= 0 ? (
                                <>
                                  <span className="font-semibold text-slate-900">
                                    {prixDiffPct}% au-dessus
                                  </span>{" "}
                                  de la moyenne de {communeLabel}
                                </>
                              ) : (
                                <>
                                  <span className="font-semibold text-slate-900">
                                    {Math.abs(prixDiffPct)}% en dessous
                                  </span>{" "}
                                  de la moyenne de {communeLabel}
                                </>
                              )}
                              {communeAvgPrix && (
                                <span className="text-slate-400">
                                  {" "}
                                  ({formatPrix(communeAvgPrix)}/m²)
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        <p className="mt-3 text-[11px] text-slate-400">
                          Source : DVF (demandes de valeurs foncières), rayon 500m,
                          3 dernières années
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* --- 3b. Historique des transactions --- */}
              {dvfTotalCount > 0 && (
                <section className="rounded-2xl bg-slate-50 p-5 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <Building2 className="h-5 w-5 shrink-0 text-slate-500" />
                      Historique des transactions
                      {accessLevel === "visitor" && (
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          ({dvfTotalCount} transactions)
                        </span>
                      )}
                    </h2>
                    <div className="ml-auto flex gap-1.5">
                      <a
                        href={dvfExportEnabled ? `/api/copropriete/${slug}/export-dvf?format=csv` : undefined}
                        className={`inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium ${dvfExportEnabled ? "text-slate-700 hover:bg-slate-50" : "text-slate-400 opacity-60 pointer-events-none"}`}
                        title={dvfExportEnabled ? "Exporter CSV" : "Réservé aux abonnés Pro"}
                      >
                        {!dvfExportEnabled && <Lock className="h-3 w-3" />}
                        <Download className="h-3 w-3" />
                        CSV
                      </a>
                      <a
                        href={dvfExportEnabled ? `/api/copropriete/${slug}/export-dvf?format=xlsx` : undefined}
                        className={`inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium ${dvfExportEnabled ? "text-slate-700 hover:bg-slate-50" : "text-slate-400 opacity-60 pointer-events-none"}`}
                        title={dvfExportEnabled ? "Exporter Excel" : "Réservé aux abonnés Pro"}
                      >
                        {!dvfExportEnabled && <Lock className="h-3 w-3" />}
                        <Download className="h-3 w-3" />
                        Excel
                      </a>
                    </div>
                  </div>
                  <Card className="border-slate-200 bg-white">
                    <CardContent className="pt-6">
                      {/* Sparkline — only if user can see it */}
                      {sparklineData.length >= 2 && accessLevel !== "visitor" && (
                        <div className="mb-6">
                          <p className="mb-2 text-xs font-medium text-slate-500">
                            Prix moyen au m² par trimestre
                          </p>
                          <Sparkline data={sparklineData} />
                        </div>
                      )}

                      {/* Visitor: just show count + CTA */}
                      {accessLevel === "visitor" ? (
                        <div className="py-4 text-center">
                          <p className="text-sm text-slate-600">
                            {dvfTotalCount} transaction{dvfTotalCount > 1 ? "s" : ""} trouvée{dvfTotalCount > 1 ? "s" : ""} à proximité
                          </p>
                          <Link
                            href="/inscription"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
                          >
                            <Lock className="h-3.5 w-3.5 text-teal-200" />
                            Créez un compte pour voir le détail
                          </Link>
                        </div>
                      ) : (
                        <>
                          {/* Desktop table */}
                          <div className="hidden sm:block">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                                    <th className="pb-2 font-medium">Date</th>
                                    <th className="pb-2 font-medium">Adresse</th>
                                    <th className="pb-2 text-right font-medium">Surface</th>
                                    <th className="pb-2 text-right font-medium">Prix</th>
                                    <th className="pb-2 text-right font-medium">Prix/m²</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {visibleDvf.map((t) => (
                                    <tr key={t.id} className="border-b border-slate-50">
                                      <td className="py-2.5 text-slate-600">
                                        {new Date(t.date_mutation).toLocaleDateString("fr-FR")}
                                      </td>
                                      <td className="max-w-[200px] truncate py-2.5 text-slate-900" title={t.adresse ?? undefined}>
                                        {t.adresse ?? "—"}
                                      </td>
                                      <td className="py-2.5 text-right text-slate-600">
                                        {Math.round(Number(t.surface))} m²
                                      </td>
                                      <td className="py-2.5 text-right font-medium text-slate-900">
                                        {formatPrix(Math.round(Number(t.prix)))}
                                      </td>
                                      <td className="py-2.5 text-right text-teal-700">
                                        {formatPrix(Number(t.prix_m2))}/m²
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Blurred overlay for free users */}
                            {dvfTotalCount > visibleDvf.length && accessLevel === "free" && (
                              <div className="relative mt-1">
                                <div className="select-none blur-sm" aria-hidden="true">
                                  <table className="w-full text-sm">
                                    <tbody>
                                      {[0, 1, 2].map((i) => (
                                        <tr key={i} className="border-b border-slate-50">
                                          <td className="py-2.5 text-slate-600">01/01/2024</td>
                                          <td className="py-2.5 text-slate-900">Adresse masquée</td>
                                          <td className="py-2.5 text-right text-slate-600">60 m²</td>
                                          <td className="py-2.5 text-right font-medium text-slate-900">250 000 €</td>
                                          <td className="py-2.5 text-right text-teal-700">4 166 €/m²</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-b from-white/40 to-white/90">
                                  <Link
                                    href="/tarifs"
                                    className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
                                  >
                                    <Lock className="h-4 w-4 text-teal-200" />
                                    Voir les {dvfTotalCount - visibleDvf.length} autres transactions — Pro
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Mobile cards */}
                          <div className="sm:hidden">
                            <div className="flex flex-col gap-2">
                              {visibleDvf.map((t) => (
                                <div key={t.id} className="rounded-lg border border-slate-100 p-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">
                                      {new Date(t.date_mutation).toLocaleDateString("fr-FR")}
                                    </span>
                                    <span className="text-sm font-bold text-teal-700">
                                      {formatPrix(Number(t.prix_m2))}/m²
                                    </span>
                                  </div>
                                  <p className="mt-1 truncate text-sm text-slate-900" title={t.adresse ?? undefined}>{t.adresse ?? "—"}</p>
                                  <div className="mt-1 flex gap-3 text-xs text-slate-500">
                                    <span>{Math.round(Number(t.surface))} m²</span>
                                    <span>{formatPrix(Math.round(Number(t.prix)))}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {dvfTotalCount > visibleDvf.length && accessLevel === "free" && (
                              <div className="mt-3 text-center">
                                <Link
                                  href="/tarifs"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
                                >
                                  <Lock className="h-3.5 w-3.5 text-teal-200" />
                                  Voir les {dvfTotalCount - visibleDvf.length} autres — Pro
                                </Link>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      <p className="mt-3 text-[11px] text-slate-400">
                        Source : DVF (demandes de valeurs foncières), rayon 500m, 3 dernières années
                      </p>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* --- 4. Informations clés --- */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <FileText className="h-5 w-5 text-slate-500" />
                  Informations clés
                </h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-slate-200 bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Hash className="h-4 w-4 text-slate-400" />
                        Identification
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <InfoRow label="Immatriculation" value={copro.numeroImmatriculation} />
                      <InfoRow
                        label="Dernière MAJ"
                        value={
                          copro.dateDerniereMaj
                            ? new Date(copro.dateDerniereMaj).toLocaleDateString("fr-FR")
                            : null
                        }
                      />
                      <InfoRow
                        label="Immatriculé le"
                        value={
                          copro.dateImmatriculation
                            ? new Date(copro.dateImmatriculation).toLocaleDateString("fr-FR")
                            : null
                        }
                      />
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        Structure
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <InfoRow label="Lots total" value={copro.nbTotalLots} />
                      <InfoRow label="Lots habitation" value={copro.nbLotsHabitation} />
                      <InfoRow label="Lots stationnement" value={copro.nbLotsStationnement} />
                      <InfoRow
                        label="Construction"
                        value={formatPeriod(copro.periodeConstruction) ?? null}
                      />
                    </CardContent>
                  </Card>
                  <Card className="border-slate-200 bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Users className="h-4 w-4 text-slate-400" />
                        Gestion
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <InfoRow label="Syndic" value={copro.typeSyndic} />
                      <InfoRow
                        label="Coopératif"
                        value={copro.syndicatCooperatif === "oui" ? "Oui" : copro.syndicatCooperatif === "non" ? "Non" : null}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Plan de péril</span>
                        {copro.coproDansPdp != null && copro.coproDansPdp > 0 ? (
                          <Badge variant="destructive" className="text-xs">Oui</Badge>
                        ) : (
                          <span className="font-medium text-slate-900">Non</span>
                        )}
                      </div>
                      <InfoRow
                        label="Résidence service"
                        value={copro.residenceService === "oui" ? "Oui" : copro.residenceService === "non" ? "Non" : null}
                      />
                    </CardContent>
                  </Card>
                </div>
              </section>
            </div>

            {/* ===== RIGHT SIDEBAR ===== */}
            <div className="min-w-0 space-y-6">
              {/* Map */}
              {hasCoords && (
                <Card className="overflow-hidden border-slate-200">
                  <div className="h-[300px]">
                    <CoproMap
                      longitude={copro.longitude!}
                      latitude={copro.latitude!}
                      label={displayName}
                      nearby={nearby.map((n) => ({
                        id: n.id,
                        slug: n.slug,
                        label: formatCoproName(n.nom_usage || n.adresse_reference || "Copropriété"),
                        scoreGlobal: n.score_global,
                        latitude: Number(n.latitude),
                        longitude: Number(n.longitude),
                      }))}
                    />
                  </div>
                </Card>
              )}

              {/* Nearby copros */}
              {nearby.length > 0 && (
                <Card className="border-slate-200 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      {nearby.length} copropriété{nearby.length > 1 ? "s" : ""} à proximité
                    </CardTitle>
                    <p className="text-xs text-slate-400">Dans un rayon de 500m</p>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 pt-0">
                    {visibleNearby.map((n) => (
                      <NearbyItem key={n.id} n={n} />
                    ))}

                    {nearby.length > visibleNearby.length && (
                      <PaywallOverlay
                        level={accessLevel}
                        ctaFreeText={`Voir ${nearby.length - visibleNearby.length} autres — Inscription gratuite`}
                        ctaProText={`Voir ${nearby.length - visibleNearby.length} autres — Pro`}
                      >
                        <div className="flex flex-col gap-2">
                          {nearby.slice(visibleNearby.length, visibleNearby.length + 5).map((n) => (
                            <NearbyItem key={n.id} n={n} />
                          ))}
                        </div>
                      </PaywallOverlay>
                    )}

                    {villeSlug && (
                      <Link
                        href={villeSlug}
                        className="mt-1 block rounded-lg border border-dashed border-slate-200 p-2.5 text-center text-xs font-medium text-teal-700 transition-colors hover:border-teal-300 hover:bg-teal-50"
                      >
                        Voir toutes les copropriétés à {communeLabel}
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Score quartier */}
              {scoreQuartier && scoreQuartier.nbCopros >= 3 && (
                <ScoreQuartierSection quartier={scoreQuartier} accessLevel={accessLevel} />
              )}

              {/* CTA */}
              <Card id="rapport-cta" className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
                <CardContent className="py-6 text-center">
                  <h3 className="mb-1 text-lg font-semibold text-slate-900">Rapport complet</h3>
                  <p className="mb-4 text-sm text-slate-500">
                    Analyse détaillée, historique et comparatif du quartier.
                  </p>
                  <DownloadButton slug={slug} accessLevel={accessLevel} hasPurchased={hasPurchased} className="w-full bg-teal-500 py-5 text-base font-semibold text-white hover:bg-teal-800">
                    Télécharger le rapport — 4,90€
                  </DownloadButton>
                  <p className="mt-2 text-[11px] text-slate-400">PDF disponible immédiatement</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Sticky CTA bar — mobile only */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-teal-200 bg-teal-600 px-4 py-3 pb-[max(12px,var(--sab))] lg:hidden">
        <DownloadButton slug={slug} accessLevel={accessLevel} hasPurchased={hasPurchased} className="w-full bg-white py-5 text-base font-semibold text-teal-700 shadow-sm hover:bg-teal-50">
          Télécharger le rapport — 4,90€
        </DownloadButton>
      </div>
      {/* Bottom spacer for sticky CTA */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}

// ---------- Sub-components ----------

function NearbyItem({ n }: { n: NearbyRow }) {
  return (
    <Link
      href={`/copropriete/${n.slug ?? n.id}`}
      className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-slate-50"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
          n.score_global !== null
            ? n.score_global >= 70
              ? "bg-teal-50 text-teal-700"
              : n.score_global >= 40
                ? "bg-amber-50 text-amber-600"
                : "bg-red-50 text-red-600"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {n.score_global ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {formatCoproName(n.nom_usage || n.adresse_reference || "Copropriété")}
        </p>
        <p className="flex items-center gap-2 text-xs text-slate-400">
          {n.nb_lots_habitation != null && <span>{n.nb_lots_habitation} lots</span>}
          <span>{Math.round(Number(n.distance_m))}m</span>
        </p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" />
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 truncate font-medium text-slate-900">{value ?? "—"}</span>
    </div>
  );
}

const DPE_BADGE_COLORS: Record<string, string> = {
  A: "bg-[#319834]",
  B: "bg-[#33cc31]",
  C: "bg-[#cbfc34] text-slate-900",
  D: "bg-[#fbfe06] text-slate-900",
  E: "bg-[#fbcc05] text-slate-900",
  F: "bg-[#fc9935]",
  G: "bg-[#fc0205]",
};

function DpeBadge({ classe }: { classe: string }) {
  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white ${DPE_BADGE_COLORS[classe] ?? "bg-slate-300"}`}
    >
      {classe}
    </span>
  );
}
