import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { makeVilleSlug, parseVilleSlug } from "@/lib/slug";
import Link from "next/link";
import type { Metadata } from "next";
import { formatCoproName } from "@/lib/utils";
import { scoreColor, scoreBg } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { ScoreHistogram } from "@/components/score-histogram";
import {
  VilleCoproList,
  type VilleCoproItem,
} from "@/components/ville-copro-list";
import {
  Building2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  ShieldAlert,
  Zap,
  DollarSign,
  Home,
  Crown,
} from "lucide-react";
import { Header } from "@/components/header";

// Force dynamic: searchParams (?cp=) makes ISR impossible
// (ISR cache key doesn't include search params → wrong content)
export const dynamic = "force-dynamic";

/* ---------- Types ---------- */

interface ExtendedStats {
  total: bigint;
  avg_score: number | null;
  median_score: number | null;
  min_score: number | null;
  max_score: number | null;
  bon: bigint;
  moyen: bigint;
  attention: bigint;
  bucket_0_39: bigint;
  bucket_40_54: bigint;
  bucket_55_69: bigint;
  bucket_70_84: bigint;
  bucket_85_100: bigint;
  pct_syndic_pro: number | null;
  nb_peril: bigint;
  avg_prix_m2: number | null;
  dpe_median: string | null;
}

interface CommuneInfo {
  nom: string;
  code: string;
  nom_dept: string;
  code_dept: string;
}

interface CoproRow {
  id: number;
  slug: string | null;
  adresse_reference: string | null;
  nom_usage: string | null;
  code_postal: string | null;
  score_global: number | null;
  nb_lots_habitation: number | null;
  type_syndic: string | null;
  periode_construction: string | null;
}

interface VoisineRow {
  code: string;
  nom: string;
  total: bigint;
  avg_score: number | null;
}

/* ---------- Helpers ---------- */

const ARRONDISSEMENT_COMMUNES = new Set(["75056", "69123", "13055"]);

function validateCp(cp: unknown): string | undefined {
  return typeof cp === "string" && /^\d{5}$/.test(cp) ? cp : undefined;
}

const DPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: "bg-green-50", text: "text-green-700", label: "Excellent" },
  B: { bg: "bg-green-50", text: "text-green-600", label: "Tr\u00e8s bon" },
  C: { bg: "bg-lime-50", text: "text-lime-700", label: "Bon" },
  D: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Moyen" },
  E: { bg: "bg-orange-50", text: "text-orange-600", label: "M\u00e9diocre" },
  F: { bg: "bg-red-50", text: "text-red-600", label: "Passoire \u00e9nerg\u00e9tique" },
  G: { bg: "bg-red-50", text: "text-red-700", label: "Passoire \u00e9nerg\u00e9tique" },
};

function syndicInterpretation(pct: number | null): { bg: string; text: string; label: string } {
  if (pct === null) return { bg: "bg-slate-50", text: "text-slate-500", label: "Donn\u00e9es insuffisantes" };
  if (pct >= 70) return { bg: "bg-teal-50", text: "text-teal-700", label: "Bonne gouvernance" };
  if (pct >= 40) return { bg: "bg-amber-50", text: "text-amber-700", label: "Gouvernance mixte" };
  return { bg: "bg-orange-50", text: "text-orange-700", label: "Gouvernance fragile" };
}

function perilInterpretation(nb: number, total: number): { bg: string; text: string; label: string } {
  if (nb === 0) return { bg: "bg-teal-50", text: "text-teal-700", label: "Aucun signalement" };
  const pct = (nb / total) * 100;
  if (pct < 1) return { bg: "bg-amber-50", text: "text-amber-700", label: "Quelques copros en difficult\u00e9" };
  return { bg: "bg-red-50", text: "text-red-700", label: `${pct.toFixed(1)}% en difficult\u00e9` };
}

async function resolveArrondissement(
  codeCommune: string,
  codePostal: string
): Promise<string | null> {
  const rows = await prisma.$queryRawUnsafe<{ nom: string }[]>(
    `SELECT DISTINCT nom_officiel_arrondissement as nom
     FROM coproprietes
     WHERE code_officiel_commune = $1 AND code_postal = $2
       AND nom_officiel_arrondissement IS NOT NULL
     LIMIT 1`,
    codeCommune,
    codePostal
  );
  return rows[0]?.nom ?? null;
}

/* ---------- Metadata ---------- */

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cp?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { cp } = await searchParams;
  const codeCommune = parseVilleSlug(slug);
  if (!codeCommune) return {};

  const codePostal = validateCp(cp);
  const isArrondissement = codePostal && ARRONDISSEMENT_COMMUNES.has(codeCommune);
  const arrondissementName = isArrondissement
    ? await resolveArrondissement(codeCommune, codePostal)
    : null;
  const effectiveCp = arrondissementName ? codePostal : undefined;

  const cpClause = effectiveCp ? "AND code_postal = $2" : "";
  const queryParams: string[] = effectiveCp
    ? [codeCommune, effectiveCp]
    : [codeCommune];

  const [info] = await prisma.$queryRawUnsafe<
    {
      nom: string;
      nom_dept: string;
      total: bigint;
      avg_score: number | null;
      avg_prix_m2: number | null;
      dpe_median: string | null;
    }[]
  >(
    `SELECT
       (SELECT INITCAP(nom_officiel_commune)
        FROM coproprietes
        WHERE code_officiel_commune = $1
          AND nom_officiel_commune IS NOT NULL
          AND nom_officiel_commune != 'null'
          AND nom_officiel_commune !~ '^\d'
        GROUP BY INITCAP(nom_officiel_commune)
        ORDER BY COUNT(*) DESC LIMIT 1) as nom,
       MODE() WITHIN GROUP (ORDER BY nom_officiel_departement) as nom_dept,
       COUNT(*) as total,
       ROUND(AVG(score_global)) as avg_score,
       ROUND(AVG(marche_prix_m2)::numeric, 0) as avg_prix_m2,
       (SELECT dpe_classe_mediane FROM coproprietes
        WHERE code_officiel_commune = $1 ${cpClause} AND dpe_classe_mediane IS NOT NULL
        GROUP BY dpe_classe_mediane ORDER BY COUNT(*) DESC LIMIT 1) as dpe_median
     FROM coproprietes
     WHERE code_officiel_commune = $1 ${cpClause}`,
    ...queryParams
  );

  if (!info) return {};

  const displayName = arrondissementName ?? info.nom;

  const prixPart = info.avg_prix_m2
    ? `, prix moyen ${Number(info.avg_prix_m2).toLocaleString("fr-FR")} \u20ac/m\u00b2`
    : "";
  const dpePart = info.dpe_median ? `, DPE ${info.dpe_median}` : "";

  const scoreText = info.avg_score != null ? `Score moyen ${info.avg_score}/100` : "";
  const ogTitle = info.avg_score != null
    ? `Copropri\u00e9t\u00e9s \u00e0 ${displayName} \u2014 Score moyen ${info.avg_score}/100`
    : `Copropri\u00e9t\u00e9s \u00e0 ${displayName}`;

  const cpParam = effectiveCp ? `?cp=${effectiveCp}` : "";
  const ogImage = `${process.env.NEXT_PUBLIC_BASE_URL || "https://coproscore.fr"}/api/og/ville/${slug}${cpParam}`;

  const titleText = info.avg_score != null
    ? `Copropri\u00e9t\u00e9s \u00e0 ${displayName} \u2014 Score moyen ${info.avg_score}/100`
    : `Copropri\u00e9t\u00e9s \u00e0 ${displayName} : score, DPE, prix`;

  return {
    title: titleText,
    description: `${Number(info.total)} copropri\u00e9t\u00e9s analys\u00e9es \u00e0 ${displayName} (${info.nom_dept}). ${scoreText}${prixPart}${dpePart}. Consultez scores et d\u00e9tails.`,
    openGraph: {
      title: ogTitle,
      description: `${Number(info.total)} copropri\u00e9t\u00e9s analys\u00e9es \u00e0 ${displayName}. ${scoreText}.`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: `${Number(info.total)} copropri\u00e9t\u00e9s \u00e0 ${displayName}. ${scoreText}.`,
      images: [ogImage],
    },
  };
}

/* ---------- Page ---------- */

export default async function VillePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cp?: string }>;
}) {
  const { slug } = await params;
  const { cp } = await searchParams;
  const codeCommune = parseVilleSlug(slug);
  if (!codeCommune) notFound();

  const codePostal = validateCp(cp);
  const isArrondissement = codePostal && ARRONDISSEMENT_COMMUNES.has(codeCommune);
  const arrondissementName = isArrondissement
    ? await resolveArrondissement(codeCommune, codePostal)
    : null;
  const effectiveCp = arrondissementName ? codePostal : undefined;

  const cpClause = effectiveCp ? "AND code_postal = $2" : "";
  const queryParams: string[] = effectiveCp
    ? [codeCommune, effectiveCp]
    : [codeCommune];

  const statsPromise = prisma.$queryRawUnsafe<ExtendedStats[]>(
    `SELECT
       COUNT(*) as total,
       ROUND(AVG(score_global)) as avg_score,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score_global) as median_score,
       MIN(score_global) as min_score,
       MAX(score_global) as max_score,
       COUNT(*) FILTER (WHERE score_global >= 70) as bon,
       COUNT(*) FILTER (WHERE score_global >= 40 AND score_global < 70) as moyen,
       COUNT(*) FILTER (WHERE score_global < 40) as attention,
       COUNT(*) FILTER (WHERE score_global < 40) as bucket_0_39,
       COUNT(*) FILTER (WHERE score_global >= 40 AND score_global < 55) as bucket_40_54,
       COUNT(*) FILTER (WHERE score_global >= 55 AND score_global < 70) as bucket_55_69,
       COUNT(*) FILTER (WHERE score_global >= 70 AND score_global < 85) as bucket_70_84,
       COUNT(*) FILTER (WHERE score_global >= 85) as bucket_85_100,
       ROUND(100.0 * COUNT(*) FILTER (WHERE type_syndic = 'Professionnel') / NULLIF(COUNT(*), 0), 1) as pct_syndic_pro,
       COUNT(*) FILTER (WHERE copro_dans_pdp > 0) as nb_peril,
       ROUND(AVG(marche_prix_m2)::numeric, 0) as avg_prix_m2,
       (SELECT dpe_classe_mediane FROM coproprietes
        WHERE code_officiel_commune = $1 ${cpClause} AND dpe_classe_mediane IS NOT NULL
        GROUP BY dpe_classe_mediane ORDER BY COUNT(*) DESC LIMIT 1) as dpe_median
     FROM coproprietes WHERE code_officiel_commune = $1 ${cpClause}`,
    ...queryParams
  );

  const infoPromise = prisma.$queryRawUnsafe<CommuneInfo[]>(
    `SELECT
       INITCAP(nom_officiel_commune) as nom,
       $1 as code,
       MODE() WITHIN GROUP (ORDER BY nom_officiel_departement) as nom_dept,
       MODE() WITHIN GROUP (ORDER BY code_officiel_departement) as code_dept
     FROM coproprietes
     WHERE code_officiel_commune = $1
       AND nom_officiel_commune IS NOT NULL
       AND nom_officiel_commune != 'null'
       AND nom_officiel_commune !~ '^\d'
     GROUP BY INITCAP(nom_officiel_commune)
     ORDER BY COUNT(*) DESC LIMIT 1`,
    codeCommune
  );

  const coprosPromise = prisma.$queryRawUnsafe<CoproRow[]>(
    `SELECT id, slug, adresse_reference, nom_usage, code_postal,
       score_global, nb_lots_habitation, type_syndic, periode_construction
     FROM coproprietes WHERE code_officiel_commune = $1 ${cpClause}
     ORDER BY score_global DESC NULLS LAST, id ASC
     LIMIT 500`,
    ...queryParams
  );

  const worst5Promise = prisma.$queryRawUnsafe<CoproRow[]>(
    `SELECT id, slug, adresse_reference, nom_usage, code_postal,
       score_global, nb_lots_habitation, type_syndic, periode_construction
     FROM coproprietes WHERE code_officiel_commune = $1 ${cpClause} AND score_global IS NOT NULL
     ORDER BY score_global ASC, id ASC
     LIMIT 5`,
    ...queryParams
  );

  const [statsRows, infoRows, copros, worst5Rows] = await Promise.all([
    statsPromise,
    infoPromise,
    coprosPromise,
    worst5Promise,
  ]);

  const stats = statsRows[0];
  const info = infoRows[0];
  if (!stats || !info) notFound();

  if (Number(stats.total) === 0) {
    return <EmptyCommunePage communeName={info.nom} />;
  }

  const communeName = info.nom;
  const displayName = arrondissementName ?? communeName;
  const nomDept = info.nom_dept;
  const codeDept = info.code_dept;

  // Voisines: other arrondissements when filtered, or nearby communes
  const voisines = effectiveCp
    ? await prisma.$queryRawUnsafe<VoisineRow[]>(
        `SELECT code_postal as code,
           MODE() WITHIN GROUP (ORDER BY nom_officiel_arrondissement) as nom,
           COUNT(*) as total, ROUND(AVG(score_global)) as avg_score
         FROM coproprietes
         WHERE code_officiel_commune = $1 AND code_postal != $2
           AND nom_officiel_arrondissement IS NOT NULL
         GROUP BY code_postal ORDER BY code_postal ASC`,
        codeCommune,
        effectiveCp
      )
    : await prisma.$queryRawUnsafe<VoisineRow[]>(
        `SELECT code_officiel_commune as code, nom_officiel_commune as nom,
           COUNT(*) as total, ROUND(AVG(score_global)) as avg_score
         FROM coproprietes
         WHERE code_officiel_departement = $1 AND code_officiel_commune != $2
           AND code_officiel_commune IS NOT NULL AND nom_officiel_commune IS NOT NULL
         GROUP BY code_officiel_commune, nom_officiel_commune
         ORDER BY total DESC LIMIT 6`,
        codeDept,
        codeCommune
      );

  const total = Number(stats.total);
  const bon = Number(stats.bon);
  const moyen = Number(stats.moyen);
  const attention = Number(stats.attention);
  const avgScore = stats.avg_score != null ? Number(stats.avg_score) : null;
  const medianScore = stats.median_score != null ? Math.round(Number(stats.median_score)) : null;
  const minScore = stats.min_score != null ? Number(stats.min_score) : null;
  const maxScore = stats.max_score != null ? Number(stats.max_score) : null;
  const nbPeril = Number(stats.nb_peril);
  const pctSyndicPro = stats.pct_syndic_pro != null ? Number(stats.pct_syndic_pro) : null;
  const avgPrixM2 = stats.avg_prix_m2 != null ? Number(stats.avg_prix_m2) : null;

  const buckets = [
    { label: "< 40", count: Number(stats.bucket_0_39), color: "#ef4444" },
    { label: "40-54", count: Number(stats.bucket_40_54), color: "#f59e0b" },
    { label: "55-69", count: Number(stats.bucket_55_69), color: "#eab308" },
    { label: "70-84", count: Number(stats.bucket_70_84), color: "#14b8a6" },
    { label: "85+", count: Number(stats.bucket_85_100), color: "#0d9488" },
  ];

  const top5 = copros.filter((c) => c.score_global !== null).slice(0, 5);
  const worst5 = worst5Rows.length > 0 && total > 5 ? worst5Rows : [];

  const clientCopros: VilleCoproItem[] = copros.map((c) => ({
    id: c.id,
    slug: c.slug,
    adresseReference: c.adresse_reference,
    nomUsage: c.nom_usage,
    codePostal: c.code_postal,
    scoreGlobal: c.score_global,
    nbLotsHabitation: c.nb_lots_habitation,
    typeSyndic: c.type_syndic,
    periodeConstruction: c.periode_construction,
  }));

  const dpeMedian = stats.dpe_median;
  const syndicInfo = syndicInterpretation(pctSyndicPro);
  const perilInfo = perilInterpretation(nbPeril, total);
  const dpeInfo = dpeMedian ? DPE_COLORS[dpeMedian] : null;

  const locationLabel = effectiveCp
    ? `${displayName}, ${communeName}`
    : communeName;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `Copropri\u00e9t\u00e9s \u00e0 ${displayName}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: locationLabel,
      addressRegion: nomDept,
      addressCountry: "FR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgScore,
      bestRating: 100,
      worstRating: 0,
      ratingCount: total,
    },
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
      {
        "@type": "ListItem",
        position: 2,
        name: displayName,
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafbfc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      {/* Header */}
      <Header />

      <main className="flex-1">
        {/* ─── 1. Hero compact ─── */}
        <section className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
            <div className="flex items-center gap-5 sm:gap-6">
              {avgScore !== null && (
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold sm:h-20 sm:w-20 sm:text-2xl ${scoreBg(avgScore)} ${scoreColor(avgScore)}`}
                >
                  {avgScore}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-slate-900 sm:text-2xl">
                  Copropri&eacute;t&eacute;s &agrave; {displayName}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  {total.toLocaleString("fr-FR")} copropri&eacute;t&eacute;
                  {total > 1 ? "s" : ""} analys&eacute;e{total > 1 ? "s" : ""} &mdash;{" "}
                  {effectiveCp ? `${communeName}, ${nomDept}` : nomDept}
                </p>
                {effectiveCp && (
                  <Link
                    href={`/ville/${slug}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-teal-700 transition-colors hover:text-teal-900"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Voir tout {communeName}
                  </Link>
                )}
              </div>
            </div>

            {/* Summary pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {medianScore !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  M&eacute;dian <strong>{medianScore}</strong>
                </span>
              )}
              {minScore !== null && maxScore !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  Min&ndash;Max <strong>{minScore} &mdash; {maxScore}</strong>
                </span>
              )}
              {avgPrixM2 != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  <DollarSign className="h-3 w-3 text-slate-400" />
                  <strong>{avgPrixM2.toLocaleString("fr-FR")}&nbsp;&euro;/m&sup2;</strong>
                </span>
              )}
              {dpeMedian && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  <Zap className="h-3 w-3 text-slate-400" />
                  DPE <strong>{dpeMedian}</strong>
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          {/* ─── 2. Sant&eacute; globale ─── */}
          <section className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Sant&eacute; globale
            </h2>

            <div className="grid items-start gap-4 lg:grid-cols-[1fr_280px]">
              {/* Left — bar chart */}
              <Card className="border-slate-200 bg-white">
                <CardContent className="py-5">
                  <p className="mb-3 text-xs font-medium text-slate-400">
                    Distribution des scores
                  </p>
                  <ScoreHistogram buckets={buckets} />
                </CardContent>
              </Card>

              {/* Right — Bon / Moyen / Attention compact */}
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:gap-3">
                <div className="flex-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-3 text-center">
                  <p className="text-xl font-bold text-teal-700">{bon.toLocaleString("fr-FR")}</p>
                  <p className="text-[11px] text-teal-700/70">
                    Bon (&ge;&nbsp;70) &mdash; {total > 0 ? Math.round((bon / total) * 100) : 0}%
                  </p>
                </div>
                <div className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-center">
                  <p className="text-xl font-bold text-amber-600">{moyen.toLocaleString("fr-FR")}</p>
                  <p className="text-[11px] text-amber-600/70">
                    Moyen (40-69) &mdash; {total > 0 ? Math.round((moyen / total) * 100) : 0}%
                  </p>
                </div>
                <div className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-center">
                  <p className="text-xl font-bold text-red-600">{attention.toLocaleString("fr-FR")}</p>
                  <p className="text-[11px] text-red-600/70">
                    Attention (&lt;&nbsp;40) &mdash; {total > 0 ? Math.round((attention / total) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Distribution bar */}
            {total > 0 && (
              <div className="mt-4 flex h-2.5 overflow-hidden rounded-full">
                {bon > 0 && (
                  <div className="bg-teal-500" style={{ width: `${(bon / total) * 100}%` }} />
                )}
                {moyen > 0 && (
                  <div className="bg-amber-400" style={{ width: `${(moyen / total) * 100}%` }} />
                )}
                {attention > 0 && (
                  <div className="bg-red-500" style={{ width: `${(attention / total) * 100}%` }} />
                )}
              </div>
            )}
          </section>

          {/* ─── 3. Points cl&eacute;s ─── */}
          <section className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Points cl&eacute;s {effectiveCp ? "de l\u2019arrondissement" : "de la commune"}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Syndic pro */}
              <div className={`rounded-lg border p-3.5 ${syndicInfo.bg === "bg-teal-50" ? "border-teal-200" : syndicInfo.bg === "bg-amber-50" ? "border-amber-200" : "border-orange-200"} ${syndicInfo.bg}`}>
                <div className="mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span className="text-xs text-slate-500">Syndic pro</span>
                </div>
                <p className="text-lg font-bold text-slate-900">
                  {pctSyndicPro != null ? `${pctSyndicPro}%` : "\u2014"}
                </p>
                <p className={`mt-0.5 text-[11px] font-medium ${syndicInfo.text}`}>
                  {syndicInfo.label}
                </p>
              </div>

              {/* P&eacute;ril */}
              <div className={`rounded-lg border p-3.5 ${perilInfo.bg === "bg-teal-50" ? "border-teal-200" : perilInfo.bg === "bg-amber-50" ? "border-amber-200" : "border-red-200"} ${perilInfo.bg}`}>
                <div className="mb-2 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-slate-500" />
                  <span className="text-xs text-slate-500">P&eacute;ril / PDP</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{nbPeril}</p>
                <p className={`mt-0.5 text-[11px] font-medium ${perilInfo.text}`}>
                  {perilInfo.label}
                </p>
              </div>

              {/* Prix moyen */}
              <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                <div className="mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                  <span className="text-xs text-slate-500">Prix moyen / m&sup2;</span>
                </div>
                <p className="text-lg font-bold text-slate-900">
                  {avgPrixM2
                    ? `${avgPrixM2.toLocaleString("fr-FR")}\u00a0\u20ac`
                    : "\u2014"}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Source DVF 3 ans
                </p>
              </div>

              {/* DPE m&eacute;dian */}
              <div className={`rounded-lg border p-3.5 ${dpeInfo ? `${dpeInfo.bg} ${dpeInfo.bg === "bg-red-50" ? "border-red-200" : dpeInfo.bg === "bg-orange-50" ? "border-orange-200" : "border-slate-200"}` : "border-slate-200 bg-white"}`}>
                <div className="mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-slate-500" />
                  <span className="text-xs text-slate-500">DPE m&eacute;dian</span>
                </div>
                <p className="text-lg font-bold text-slate-900">
                  {dpeMedian ?? "\u2014"}
                </p>
                <p className={`mt-0.5 text-[11px] font-medium ${dpeInfo ? dpeInfo.text : "text-slate-400"}`}>
                  {dpeInfo ? dpeInfo.label : "Non disponible"}
                </p>
              </div>
            </div>
          </section>

          {/* ─── 4. Classement Top & Flop ─── */}
          {(top5.length > 0 || worst5.length > 0) && (
            <section className="mb-8">
              <h2 className="mb-4 text-base font-semibold text-slate-900">
                Classement
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Top 5 */}
                {top5.length > 0 && (
                  <Card className="border-slate-200 bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                        <TrendingUp className="h-4 w-4" />
                        Top 5 meilleures
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 pt-0">
                      <div className="divide-y divide-slate-100">
                        {top5.map((c, i) => (
                          <Link
                            key={c.id}
                            href={`/copropriete/${c.slug ?? c.id}`}
                            className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-slate-50"
                          >
                            <span className="w-4 text-center text-[11px] font-medium text-slate-400">
                              {i + 1}
                            </span>
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold ${scoreBg(c.score_global)} ${scoreColor(c.score_global)}`}
                            >
                              {c.score_global}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                              {formatCoproName(c.nom_usage || c.adresse_reference || "Copropri\u00e9t\u00e9")}
                            </span>
                            {c.nb_lots_habitation != null && (
                              <span className="hidden text-xs text-slate-400 sm:inline">
                                {c.nb_lots_habitation} lots
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Worst 5 */}
                {worst5.length > 0 && (
                  <Card className="border-slate-200 bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-red-600">
                        <ShieldAlert className="h-4 w-4" />
                        5 plus en difficult&eacute;
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 pt-0">
                      <div className="divide-y divide-slate-100">
                        {worst5.map((c) => (
                          <Link
                            key={c.id}
                            href={`/copropriete/${c.slug ?? c.id}`}
                            className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-slate-50"
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold ${scoreBg(c.score_global)} ${scoreColor(c.score_global)}`}
                            >
                              {c.score_global}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                              {formatCoproName(c.nom_usage || c.adresse_reference || "Copropri\u00e9t\u00e9")}
                            </span>
                            {c.nb_lots_habitation != null && (
                              <span className="hidden text-xs text-slate-400 sm:inline">
                                {c.nb_lots_habitation} lots
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          )}

          {/* ─── 5. Toutes les copros ─── */}
          <section className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Toutes les copropri&eacute;t&eacute;s
            </h2>
            <Card className="border-slate-200 bg-white">
              <CardContent className="pt-5">
                <VilleCoproList copros={clientCopros} totalCount={total} villeSlug={slug} cp={effectiveCp} />
              </CardContent>
            </Card>
          </section>

          {/* ─── Voisines / Autres arrondissements ─── */}
          {voisines.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                <MapPin className="h-4 w-4 text-slate-400" />
                {effectiveCp
                  ? `Autres arrondissements (${communeName})`
                  : `Communes voisines (${nomDept})`}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {voisines.map((v) => (
                  <Link
                    key={v.code}
                    href={
                      effectiveCp
                        ? `/ville/${slug}?cp=${v.code}`
                        : `/ville/${makeVilleSlug(v.nom, v.code)}`
                    }
                    className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-teal-300 hover:bg-teal-50/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 group-hover:text-teal-700">
                        {v.nom}
                      </p>
                      <p className="text-xs text-slate-400">
                        {Number(v.total).toLocaleString("fr-FR")} copro
                        {Number(v.total) > 1 ? "s" : ""} &middot; score moyen{" "}
                        {v.avg_score != null ? Number(v.avg_score) : "N/A"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ─── 6. CTA bandeau ─── */}
        <section className="border-t bg-gradient-to-r from-teal-700 to-teal-600">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:text-left">
            <Crown className="h-8 w-8 shrink-0 text-teal-200" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-white">
                Besoin d&apos;analyser cette commune en profondeur&nbsp;?
              </p>
              <p className="mt-0.5 text-sm text-teal-100">
                Acc&eacute;dez &agrave; toutes les donn&eacute;es avec l&apos;offre Pro.
              </p>
            </div>
            <Link href="/tarifs">
              <Button className="bg-white text-teal-700 hover:bg-teal-50">
                D&eacute;couvrir l&apos;offre Pro &rarr;
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

/* ---------- Empty commune ---------- */

function EmptyCommunePage({ communeName }: { communeName: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Copro<span className="text-teal-600">Score</span>
          </Link>
          <span className="text-sm text-slate-300">/</span>
          <span className="truncate text-sm text-slate-500">{communeName}</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <Building2 className="h-9 w-9 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{communeName}</h1>
        <p className="mt-3 max-w-md text-center text-slate-500">
          Aucune copropri&eacute;t&eacute; r&eacute;f&eacute;renc&eacute;e dans
          cette commune pour le moment. Les donn&eacute;es sont issues du RNIC et
          couvrent les copropri&eacute;t&eacute;s immatricul&eacute;es.
        </p>
        <Link href="/" className="mt-8">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Retour &agrave; l&apos;accueil
          </Button>
        </Link>
      </main>

      <Footer />
    </div>
  );
}
