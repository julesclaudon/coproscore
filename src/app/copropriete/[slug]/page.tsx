import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { ScoreGauge } from "./score-gauge";
import { ScoreBar } from "./score-bar";
import { DpeDistribution } from "./dpe-distribution";
import { CoproMap } from "./copro-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import {
  Building2,
  MapPin,
  Calendar,
  FileText,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// ISR: revalidate every 24h
export const revalidate = 86400;

// ISR on-demand generation for 619K pages
// Pages are generated on first request and cached for 24h (revalidate above).
// The sitemap.xml ensures all URLs are discoverable by search engines.
export async function generateStaticParams() {
  return [];
}

// SEO metadata
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
  const ville = [copro.codePostal, copro.communeAdresse]
    .filter(Boolean)
    .join(" ");
  const scoreText =
    copro.scoreGlobal != null ? `Score ${copro.scoreGlobal}/100` : "";
  const lotsText =
    copro.nbLotsHabitation != null
      ? `${copro.nbLotsHabitation} lots`
      : "";
  const details = [
    scoreText,
    lotsText,
    copro.typeSyndic ? `syndic ${copro.typeSyndic.toLowerCase()}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const dimensionText = [
    copro.scoreTechnique != null
      ? `Technique ${copro.scoreTechnique}/25`
      : "",
    copro.scoreRisques != null ? `Risques ${copro.scoreRisques}/30` : "",
    copro.scoreGouvernance != null
      ? `Gouvernance ${copro.scoreGouvernance}/25`
      : "",
    copro.scoreEnergie != null
      ? `\u00C9nergie ${copro.scoreEnergie}/20`
      : "",
    copro.scoreMarche != null ? `March\u00e9 ${copro.scoreMarche}/20` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    title: `Score copropri\u00e9t\u00e9 ${adresse} - CoproScore`,
    description: `${details}. D\u00e9tail : ${dimensionText}. Copropri\u00e9t\u00e9 \u00e0 ${ville}. Donn\u00e9es publiques RNIC, DVF et ADEME.`,
    openGraph: {
      title: `Score copropri\u00e9t\u00e9 ${adresse}`,
      description: `${details}. Analyse compl\u00e8te bas\u00e9e sur les donn\u00e9es publiques.`,
    },
  };
}

function scoreColorClass(score: number | null) {
  if (score === null) return "text-slate-400";
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

function scoreLabel(score: number | null) {
  if (score === null) return "Non calcul\u00e9";
  if (score >= 70) return "Bon";
  if (score >= 40) return "Moyen";
  return "Attention requise";
}

function scoreBadgeClasses(score: number | null) {
  if (score === null) return "bg-slate-100 text-slate-500";
  if (score >= 70) return "bg-emerald-50 text-emerald-700";
  if (score >= 40) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function formatPrix(n: number): string {
  return n.toLocaleString("fr-FR") + " \u20AC";
}

function formatEvolution(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return sign + n.toFixed(1) + " %";
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

interface NearbyRow {
  id: number;
  slug: string | null;
  adresse_reference: string | null;
  commune_adresse: string | null;
  code_postal: string | null;
  nom_usage: string | null;
  score_global: number | null;
  nb_lots_habitation: number | null;
  distance_m: number;
}

const NEARBY_RADIUS = 500;
const LAT_PER_METER = 1 / 111320;
const LON_PER_METER = 1 / 77370;

async function fetchNearby(
  coproId: number,
  lon: number,
  lat: number
): Promise<NearbyRow[]> {
  const dLat = NEARBY_RADIUS * LAT_PER_METER;
  const dLon = NEARBY_RADIUS * LON_PER_METER;

  return prisma.$queryRawUnsafe<NearbyRow[]>(
    `SELECT id, slug, adresse_reference, commune_adresse, code_postal, nom_usage,
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
     LIMIT 5`,
    lat,
    lon,
    dLat,
    dLon,
    coproId
  );
}

export default async function CoproprietePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Handle numeric ID redirect (backward compatibility)
  if (/^\d+$/.test(slug)) {
    const numId = parseInt(slug, 10);
    const row = await prisma.copropriete.findUnique({
      where: { id: numId },
      select: { slug: true },
    });
    if (row?.slug) {
      redirect(`/copropriete/${row.slug}`);
    }
    notFound();
  }

  const copro = await prisma.copropriete.findUnique({ where: { slug } });
  if (!copro) notFound();

  const dimensions = [
    { label: "Technique", score: copro.scoreTechnique, max: 25 },
    { label: "Risques", score: copro.scoreRisques, max: 30 },
    { label: "Gouvernance", score: copro.scoreGouvernance, max: 25 },
    { label: "\u00C9nergie", score: copro.scoreEnergie, max: 20 },
    { label: "March\u00e9", score: copro.scoreMarche, max: 20 },
  ];

  const hasMarketData = copro.marchePrixM2 != null;
  const hasDpe = copro.dpeClasseMediane != null;
  const dpeDistribution: Record<string, number> =
    hasDpe && copro.dpeDistribution
      ? JSON.parse(copro.dpeDistribution)
      : {};

  const hasCoords = copro.longitude != null && copro.latitude != null;

  const nearby = hasCoords
    ? await fetchNearby(copro.id, copro.longitude!, copro.latitude!)
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Copro<span className="text-emerald-500">Score</span>
          </Link>
          <span className="text-sm text-slate-300">/</span>
          <span className="truncate text-sm text-slate-500">
            {copro.nomUsage || copro.adresseReference || "Copropri\u00e9t\u00e9"}
          </span>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10">
          {/* Title block */}
          <div className="mb-10">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {copro.nomUsage || copro.adresseReference || "Copropri\u00e9t\u00e9"}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {copro.adresseReference}
                  </span>
                  <span>
                    {copro.codePostal} {copro.communeAdresse}
                  </span>
                </div>
                {copro.communeAdresse && copro.codeOfficielCommune && (
                  <div className="mt-2">
                    <Link
                      href={`/ville/${slugifyInline(copro.communeAdresse)}-${copro.codeOfficielCommune}`}
                      className="text-sm text-emerald-600 hover:underline"
                    >
                      Voir toutes les copropri&eacute;t&eacute;s &agrave; {copro.communeAdresse}
                    </Link>
                  </div>
                )}
              </div>
              {copro.scoreGlobal != null && (
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 ${scoreBadgeClasses(copro.scoreGlobal)}`}
                >
                  <span className="text-2xl font-bold">
                    {copro.scoreGlobal}
                  </span>
                  <span className="text-sm font-medium">/100</span>
                </div>
              )}
            </div>
          </div>

          {/* Main grid: content + sidebar */}
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left column */}
            <div className="space-y-8">
              {/* Score & Dimensions */}
              <div className="grid gap-6 sm:grid-cols-2">
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Score global
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center pb-6">
                    <ScoreGauge score={copro.scoreGlobal} />
                    <p
                      className={`mt-2 text-lg font-semibold ${scoreColorClass(copro.scoreGlobal)}`}
                    >
                      {scoreLabel(copro.scoreGlobal)}
                    </p>
                    {copro.indiceConfiance !== null && (
                      <p className="mt-1 text-xs text-slate-400">
                        Indice de confiance : {Math.round(copro.indiceConfiance * 100)}%
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      D&eacute;tail par dimension
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5 pt-2">
                    {dimensions.map((d) => (
                      <ScoreBar
                        key={d.label}
                        label={d.label}
                        score={d.score}
                        max={d.max}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Market data */}
              {hasMarketData && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Donn&eacute;es march&eacute; immobilier
                    </CardTitle>
                    <p className="text-xs text-slate-400">
                      Transactions DVF dans un rayon de 500m (3 derni&egrave;res ann&eacute;es)
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">
                          {formatPrix(Math.round(copro.marchePrixM2!))}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Prix moyen / m&sup2;
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {copro.marcheEvolution != null &&
                            (copro.marcheEvolution >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ))}
                          <p
                            className={`text-2xl font-bold ${
                              copro.marcheEvolution != null
                                ? copro.marcheEvolution >= 0
                                  ? "text-emerald-500"
                                  : "text-red-500"
                                : "text-slate-400"
                            }`}
                          >
                            {copro.marcheEvolution != null
                              ? formatEvolution(copro.marcheEvolution)
                              : "\u2014"}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          &Eacute;volution annuelle
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-slate-900">
                          {copro.marcheNbTransactions ?? "\u2014"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Transactions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* DPE */}
              {hasDpe && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Diagnostic de Performance &Eacute;nerg&eacute;tique
                    </CardTitle>
                    <p className="text-xs text-slate-400">
                      {copro.dpeNbLogements} DPE &agrave; proximit&eacute; (50m)
                      &mdash; Classe m&eacute;diane : {copro.dpeClasseMediane}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <DpeDistribution
                      distribution={dpeDistribution}
                      median={copro.dpeClasseMediane!}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Key info */}
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Informations cl&eacute;s
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" /> Adresse
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">
                        {copro.adresseReference ?? "\u2014"}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3 w-3" /> Commune
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">
                        {copro.codePostal} {copro.communeAdresse ?? "\u2014"}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Building2 className="h-3 w-3" /> Lots d&apos;habitation
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">
                        {copro.nbLotsHabitation ?? "\u2014"}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Building2 className="h-3 w-3" /> Lots total
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">
                        {copro.nbTotalLots ?? "\u2014"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Syndic</dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">
                        {copro.typeSyndic ? (
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-700"
                          >
                            {copro.typeSyndic}
                          </Badge>
                        ) : (
                          "\u2014"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" /> Construction
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">
                        {copro.periodeConstruction?.replace(/_/g, " ") ??
                          "\u2014"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Plan de p&eacute;ril</dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">
                        {copro.coproDansPdp && copro.coproDansPdp > 0 ? (
                          <Badge variant="destructive">Oui</Badge>
                        ) : (
                          "Non"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                        <FileText className="h-3 w-3" /> Immatriculation
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">
                        {copro.numeroImmatriculation}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" /> Derni&egrave;re MAJ
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">
                        {copro.dateDerniereMaj
                          ? new Date(copro.dateDerniereMaj).toLocaleDateString(
                              "fr-FR"
                            )
                          : "\u2014"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Map */}
              {hasCoords && (
                <Card className="overflow-hidden border-slate-200">
                  <div className="h-[300px]">
                    <CoproMap
                      longitude={copro.longitude!}
                      latitude={copro.latitude!}
                      label={
                        copro.nomUsage ||
                        copro.adresseReference ||
                        "Copropri\u00e9t\u00e9"
                      }
                    />
                  </div>
                </Card>
              )}

              {/* CTA */}
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="py-6 text-center">
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">
                    Rapport complet
                  </h3>
                  <p className="mb-4 text-sm text-slate-500">
                    Analyse d&eacute;taill&eacute;e, historique, recommandations
                    et comparatif du quartier.
                  </p>
                  <Button className="w-full bg-emerald-500 py-5 text-base font-semibold text-white hover:bg-emerald-600">
                    Obtenir le rapport complet &mdash; 9.90&euro;
                  </Button>
                  <p className="mt-2 text-xs text-slate-400">
                    PDF t&eacute;l&eacute;chargeable imm&eacute;diatement
                  </p>
                </CardContent>
              </Card>

              {/* Nearby copros */}
              {nearby.length > 0 && (
                <Card className="border-slate-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Copropri&eacute;t&eacute;s &agrave; proximit&eacute;
                    </CardTitle>
                    <p className="text-xs text-slate-400">
                      Dans un rayon de 500m
                    </p>
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
                                ? "bg-emerald-50 text-emerald-600"
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
                            {n.nom_usage ||
                              n.adresse_reference ||
                              "Copropri\u00e9t\u00e9"}
                          </p>
                          <p className="flex items-center gap-2 text-xs text-slate-400">
                            {n.nb_lots_habitation != null && (
                              <span>{n.nb_lots_habitation} lots</span>
                            )}
                            <span>{Math.round(Number(n.distance_m))}m</span>
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-emerald-500" />
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
