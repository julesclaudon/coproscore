import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { ScoreGauge } from "./score-gauge";
import { DpeDistribution } from "./dpe-distribution";
import { CoproMap } from "./copro-map";
import { formatCoproName } from "@/lib/utils";
import { formatPeriod } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

// ISR: revalidate every 24h
export const revalidate = 86400;

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
  if (/^\d+$/.test(slug)) return {};

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
    copro.scoreEnergie != null ? `\u00C9nergie ${copro.scoreEnergie}/20` : "",
    copro.scoreMarche != null ? `March\u00e9 ${copro.scoreMarche}/20` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const displayName = formatCoproName(adresse);
  const ogTitle = copro.scoreGlobal != null
    ? `${displayName} \u2014 Score ${copro.scoreGlobal}/100`
    : displayName;

  return {
    title: `${displayName} \u2014 Score copropri\u00e9t\u00e9`,
    description: `Score d\u00e9taill\u00e9 de ${displayName} \u00e0 ${ville} : technique, risques, gouvernance, \u00e9nergie, march\u00e9. ${details}.`,
    openGraph: {
      title: ogTitle,
      description: `Score d\u00e9taill\u00e9 de ${displayName} \u00e0 ${ville} : technique, risques, gouvernance, \u00e9nergie, march\u00e9.`,
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
  if (score === null) return "Non calcul\u00e9";
  if (score >= 70) return "Bon";
  if (score >= 40) return "Moyen";
  return "Attention requise";
}

function formatPrix(n: number): string {
  return n.toLocaleString("fr-FR") + "\u00A0\u20AC";
}

function formatEvolution(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return sign + n.toFixed(1) + "\u00A0%";
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
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
  return "P\u00e9riode de construction non renseign\u00e9e";
}

function risquesExplanation(copro: CoproData): string {
  if (copro.coproDansPdp && copro.coproDansPdp > 0)
    return "Copropri\u00e9t\u00e9 en plan de pr\u00e9vention des risques";
  return "Aucun risque ou proc\u00e9dure identifi\u00e9";
}

function gouvernanceExplanation(copro: CoproData): string {
  const parts: string[] = [];
  if (copro.typeSyndic) parts.push(`Syndic ${copro.typeSyndic}`);
  if (copro.syndicatCooperatif === "oui") parts.push("coop\u00e9ratif");
  if (copro.nbTotalLots) parts.push(`${copro.nbTotalLots} lots`);
  return parts.length > 0 ? parts.join(", ") : "Type de syndic non renseign\u00e9";
}

function energieExplanation(copro: CoproData): string {
  if (copro.dpeClasseMediane) return `DPE m\u00e9dian classe ${copro.dpeClasseMediane}`;
  const period = formatPeriod(copro.periodeConstruction);
  if (period) return `Pas de DPE, estim\u00e9 selon p\u00e9riode (${period})`;
  return "Aucun DPE collectif disponible";
}

function marcheExplanation(copro: CoproData): string {
  if (copro.marchePrixM2 != null) {
    const prix = formatPrix(Math.round(copro.marchePrixM2));
    if (copro.marcheEvolution != null)
      return `${prix}/m\u00b2, ${formatEvolution(copro.marcheEvolution)} /an`;
    return `${prix}/m\u00b2`;
  }
  return "Donn\u00e9es de march\u00e9 insuffisantes";
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
     LIMIT 5`,
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

// ---------- Page Component ----------

export default async function CoproprietePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (/^\d+$/.test(slug)) {
    const numId = parseInt(slug, 10);
    const row = await prisma.copropriete.findUnique({
      where: { id: numId },
      select: { slug: true },
    });
    if (row?.slug) redirect(`/copropriete/${row.slug}`);
    notFound();
  }

  const copro = await prisma.copropriete.findUnique({ where: { slug } });
  if (!copro) notFound();

  const hasCoords = copro.longitude != null && copro.latitude != null;
  const nearby = hasCoords ? await fetchNearby(copro.id, copro.longitude!, copro.latitude!) : [];
  const communeAvgPrix = copro.codeOfficielCommune
    ? await fetchCommuneAvgPrix(copro.codeOfficielCommune)
    : null;

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
    copro.nomUsage || copro.adresseReference || "Copropri\u00e9t\u00e9"
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

  const dimensions = [
    {
      key: "technique",
      label: "Technique",
      score: copro.scoreTechnique,
      max: 25,
      explanation: techniqueExplanation(copro),
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
      icon: Users,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-500",
    },
    {
      key: "energie",
      label: "\u00C9nergie",
      score: copro.scoreEnergie,
      max: 20,
      explanation: energieExplanation(copro),
      icon: Zap,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
    },
    {
      key: "marche",
      label: "March\u00e9",
      score: copro.scoreMarche,
      max: 20,
      explanation: marcheExplanation(copro),
      icon: TrendingUp,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Copro<span className="text-teal-600">Score</span>
          </Link>
        </div>
      </header>

      {/* Hero band */}
      <section className="border-b bg-white">
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
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{displayName}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-slate-500">
                <MapPin className="h-4 w-4 shrink-0" />
                {copro.adresseReference}, {copro.codePostal} {copro.communeAdresse}
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
                  <Badge variant="destructive">Plan de p&eacute;ril</Badge>
                )}
              </div>
            </div>

            {copro.scoreGlobal != null && (
              <div className="flex flex-col items-center gap-1">
                <ScoreGauge score={copro.scoreGlobal} />
                <p className={`text-sm font-semibold ${scoreColorClass(copro.scoreGlobal)}`}>
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
            <div className="space-y-8">
              {/* --- 1. Score d\u00e9taill\u00e9 --- */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Score d&eacute;taill&eacute;</h2>
                <div className="flex flex-col gap-3">
                  {dimensions.map((d) => {
                    const Icon = d.icon;
                    const isNull = d.score === null;
                    const pct = d.score != null ? d.score / d.max : 0;
                    const color = d.score != null
                      ? pct >= 0.7 ? "text-teal-700" : pct >= 0.4 ? "text-amber-600" : "text-red-600"
                      : "text-slate-400";

                    return (
                      <div
                        key={d.key}
                        className={`flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm${isNull ? " opacity-60" : ""}`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${d.iconBg}`}>
                          <Icon className={`h-5 w-5 ${d.iconColor}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">{d.label}</p>
                          {isNull ? (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                              <Info className="h-3 w-3" />
                              Donn&eacute;es non disponibles
                            </p>
                          ) : (
                            <p className="mt-0.5 truncate text-xs text-slate-500">{d.explanation}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-lg font-bold leading-tight ${color}`}>
                              {d.score ?? "\u2014"}
                            </p>
                            <p className="text-[10px] text-slate-400">/{d.max}</p>
                          </div>
                          <MiniGauge score={d.score} max={d.max} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* --- 2. DPE --- */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Diagnostic &Eacute;nerg&eacute;tique
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
                          Les donn&eacute;es DPE sont issues de l&apos;ADEME et couvrent environ 11% des
                          copropri&eacute;t&eacute;s. Le score &eacute;nergie est estim&eacute; &agrave;
                          partir de la p&eacute;riode de construction.
                        </p>
                      </div>
                    ) : dpeTotal === 1 ? (
                      <div className="flex items-center gap-4 py-2">
                        <DpeBadge classe={copro.dpeClasseMediane!} />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            1 diagnostic trouv&eacute; &mdash; Classe {copro.dpeClasseMediane}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            Donn&eacute;e ADEME &agrave; proximit&eacute; (50m)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mb-4 text-xs text-slate-400">
                          {copro.dpeNbLogements} DPE &agrave; proximit&eacute; (50m) &mdash; Classe
                          m&eacute;diane : <span className="font-semibold text-slate-600">{copro.dpeClasseMediane}</span>
                        </p>
                        <DpeDistribution distribution={dpeDistribution} median={copro.dpeClasseMediane!} />
                      </>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* --- 3. March\u00e9 immobilier --- */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  March&eacute; immobilier
                </h2>
                <Card className="border-slate-200 bg-white">
                  <CardContent className="pt-6">
                    {!hasMarketData ? (
                      <div className="py-4 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                          <TrendingUp className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">
                          Donn&eacute;es de march&eacute; insuffisantes
                        </p>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
                          Aucune transaction DVF trouv&eacute;e dans un rayon de 500m sur les 3
                          derni&egrave;res ann&eacute;es.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-3 sm:gap-6">
                          <div className="text-center">
                            <p className="text-lg font-bold text-slate-900 sm:text-2xl">
                              {formatPrix(Math.round(copro.marchePrixM2!))}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">Prix moyen / m&sup2;</p>
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
                                  : "\u2014"}
                              </p>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">&Eacute;volution annuelle</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-slate-900 sm:text-2xl">
                              {copro.marcheNbTransactions ?? "\u2014"}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">Transactions</p>
                          </div>
                        </div>

                        {/* Commune comparison */}
                        {prixDiffPct !== null && (
                          <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3">
                            <p className="text-sm text-slate-600">
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
                                  ({formatPrix(communeAvgPrix)}/m&sup2;)
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        <p className="mt-3 text-[11px] text-slate-400">
                          Source : DVF (demandes de valeurs fonci&egrave;res), rayon 500m,
                          3 derni&egrave;res ann&eacute;es
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* --- 4. Informations cl\u00e9s --- */}
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <FileText className="h-5 w-5 text-slate-500" />
                  Informations cl&eacute;s
                </h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Identification */}
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

                  {/* Structure */}
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

                  {/* Gestion */}
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
                        <span className="text-slate-500">Plan de p&eacute;ril</span>
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
            <div className="space-y-6">
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
                        label: formatCoproName(n.nom_usage || n.adresse_reference || "Copropri\u00e9t\u00e9"),
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
                      Copropri&eacute;t&eacute;s &agrave; proximit&eacute;
                    </CardTitle>
                    <p className="text-xs text-slate-400">Dans un rayon de 500m</p>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 pt-0">
                    {nearby.map((n) => (
                      <Link
                        key={n.id}
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
                            {formatCoproName(n.nom_usage || n.adresse_reference || "Copropri\u00e9t\u00e9")}
                          </p>
                          <p className="flex items-center gap-2 text-xs text-slate-400">
                            {n.nb_lots_habitation != null && <span>{n.nb_lots_habitation} lots</span>}
                            <span>{Math.round(Number(n.distance_m))}m</span>
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" />
                      </Link>
                    ))}
                    {villeSlug && (
                      <Link
                        href={villeSlug}
                        className="mt-1 block rounded-lg border border-dashed border-slate-200 p-2.5 text-center text-xs font-medium text-teal-700 transition-colors hover:border-teal-300 hover:bg-teal-50"
                      >
                        Voir toutes les copropri&eacute;t&eacute;s &agrave; {communeLabel}
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* CTA */}
              <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
                <CardContent className="py-6 text-center">
                  <h3 className="mb-1 text-lg font-semibold text-slate-900">Rapport complet</h3>
                  <p className="mb-4 text-sm text-slate-500">
                    Analyse d&eacute;taill&eacute;e, historique et comparatif du quartier.
                  </p>
                  <Button className="w-full bg-teal-500 py-5 text-base font-semibold text-white hover:bg-teal-800">
                    T&eacute;l&eacute;charger le rapport &mdash; 9.90&euro;
                  </Button>
                  <p className="mt-2 text-[11px] text-slate-400">PDF disponible imm&eacute;diatement</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Sticky CTA bar — mobile only */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Button className="w-full bg-teal-700 py-5 text-base font-semibold text-white hover:bg-teal-800">
          T&eacute;l&eacute;charger le rapport &mdash; 9.90&euro;
        </Button>
      </div>
      {/* Bottom spacer for sticky CTA */}
      <div className="h-[72px] lg:hidden" />
    </div>
  );
}

// ---------- Sub-components ----------

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value ?? "\u2014"}</span>
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
