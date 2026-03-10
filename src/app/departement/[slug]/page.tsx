import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { makeVilleSlug, makeDeptSlug, parseDeptSlug } from "@/lib/slug";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ScoreHistogram } from "@/components/score-histogram";
import { scoreColor, scoreBg } from "@/lib/format";
import {
  Home,
  ChevronRight,
  ArrowRight,
  Building2,
  Zap,
  DollarSign,
  ShieldAlert,
  Crown,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ---------- Types ---------- */

interface DeptStats {
  code_dept: string;
  nom_dept: string;
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

interface CommuneRow {
  code: string;
  nom: string;
  total: bigint;
  avg_score: number | null;
}

/* ---------- Helpers ---------- */

const DPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: "bg-green-50", text: "text-green-700", label: "Excellent" },
  B: { bg: "bg-green-50", text: "text-green-600", label: "Très bon" },
  C: { bg: "bg-lime-50", text: "text-lime-700", label: "Bon" },
  D: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Moyen" },
  E: { bg: "bg-orange-50", text: "text-orange-600", label: "Médiocre" },
  F: { bg: "bg-red-50", text: "text-red-600", label: "Passoire énergétique" },
  G: { bg: "bg-red-50", text: "text-red-700", label: "Passoire énergétique" },
};

function syndicInterpretation(pct: number | null): { bg: string; text: string; label: string } {
  if (pct === null) return { bg: "bg-slate-50", text: "text-slate-500", label: "Données insuffisantes" };
  if (pct >= 70) return { bg: "bg-teal-50", text: "text-teal-700", label: "Bonne gouvernance" };
  if (pct >= 40) return { bg: "bg-amber-50", text: "text-amber-700", label: "Gouvernance mixte" };
  return { bg: "bg-orange-50", text: "text-orange-700", label: "Gouvernance fragile" };
}

function perilInterpretation(nb: number, total: number): { bg: string; text: string; label: string } {
  if (nb === 0) return { bg: "bg-teal-50", text: "text-teal-700", label: "Aucun signalement" };
  const pct = (nb / total) * 100;
  if (pct < 1) return { bg: "bg-amber-50", text: "text-amber-700", label: "Quelques copros en difficulté" };
  return { bg: "bg-red-50", text: "text-red-700", label: `${pct.toFixed(1)}% en difficulté` };
}

/* ---------- Metadata ---------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const codeDept = parseDeptSlug(slug);
  if (!codeDept) return {};

  const [info] = await prisma.$queryRawUnsafe<
    { nom_dept: string; total: bigint; avg_score: number | null }[]
  >(
    `SELECT
       MODE() WITHIN GROUP (ORDER BY nom_officiel_departement) as nom_dept,
       COUNT(*) as total,
       ROUND(AVG(score_global)) as avg_score
     FROM coproprietes
     WHERE code_officiel_departement = $1`,
    codeDept
  );
  if (!info) return {};

  const total = Number(info.total);
  const nomDept = info.nom_dept;
  const scoreText = info.avg_score != null ? ` Score moyen ${info.avg_score}/100.` : "";

  return {
    title: `Copropriétés dans le département ${nomDept} (${codeDept}) — CoproScore`,
    description: `Analysez les ${total.toLocaleString("fr-FR")} copropriétés du département ${nomDept}. Scores de santé, DPE, prix au m² — données officielles RNIC.${scoreText}`,
    alternates: {
      canonical: `https://coproscore.fr/departement/${slug}`,
    },
    ...(total < 5 && { robots: { index: false, follow: true } }),
  };
}

/* ---------- Page ---------- */

export default async function DepartementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const codeDept = parseDeptSlug(slug);
  if (!codeDept) notFound();

  const statsPromise = prisma.$queryRawUnsafe<DeptStats[]>(
    `SELECT
       code_officiel_departement as code_dept,
       MODE() WITHIN GROUP (ORDER BY nom_officiel_departement) as nom_dept,
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
        WHERE code_officiel_departement = $1 AND dpe_classe_mediane IS NOT NULL
        GROUP BY dpe_classe_mediane ORDER BY COUNT(*) DESC LIMIT 1) as dpe_median
     FROM coproprietes
     WHERE code_officiel_departement = $1
     GROUP BY code_officiel_departement`,
    codeDept
  );

  const communesPromise = prisma.$queryRawUnsafe<CommuneRow[]>(
    `SELECT
       code_officiel_commune as code,
       INITCAP(MODE() WITHIN GROUP (ORDER BY nom_officiel_commune)) as nom,
       COUNT(*) as total,
       ROUND(AVG(score_global)) as avg_score
     FROM coproprietes
     WHERE code_officiel_departement = $1
       AND code_officiel_commune IS NOT NULL
       AND nom_officiel_commune IS NOT NULL
     GROUP BY code_officiel_commune
     ORDER BY total DESC`,
    codeDept
  );

  const [statsRows, communes] = await Promise.all([statsPromise, communesPromise]);
  const stats = statsRows[0];
  if (!stats) notFound();

  const nomDept = stats.nom_dept;
  const total = Number(stats.total);
  const avgScore = stats.avg_score != null ? Number(stats.avg_score) : null;
  const medianScore = stats.median_score != null ? Math.round(Number(stats.median_score)) : null;
  const minScore = stats.min_score != null ? Number(stats.min_score) : null;
  const maxScore = stats.max_score != null ? Number(stats.max_score) : null;
  const bon = Number(stats.bon);
  const moyen = Number(stats.moyen);
  const attention = Number(stats.attention);
  const nbPeril = Number(stats.nb_peril);
  const pctSyndicPro = stats.pct_syndic_pro != null ? Number(stats.pct_syndic_pro) : null;
  const avgPrixM2 = stats.avg_prix_m2 != null ? Number(stats.avg_prix_m2) : null;
  const dpeMedian = stats.dpe_median;
  const dpeInfo = dpeMedian ? DPE_COLORS[dpeMedian] : null;
  const syndicInfo = syndicInterpretation(pctSyndicPro);
  const perilInfo = perilInterpretation(nbPeril, total);

  const buckets = [
    { label: "< 40", count: Number(stats.bucket_0_39), color: "#ef4444" },
    { label: "40-54", count: Number(stats.bucket_40_54), color: "#f59e0b" },
    { label: "55-69", count: Number(stats.bucket_55_69), color: "#eab308" },
    { label: "70-84", count: Number(stats.bucket_70_84), color: "#14b8a6" },
    { label: "85+", count: Number(stats.bucket_85_100), color: "#0d9488" },
  ];

  // Top 5 communes by score
  const top5 = [...communes]
    .filter((c) => c.avg_score != null)
    .sort((a, b) => Number(b.avg_score) - Number(a.avg_score))
    .slice(0, 5);

  // Bottom 5
  const worst5 = communes.length > 5
    ? [...communes]
        .filter((c) => c.avg_score != null)
        .sort((a, b) => Number(a.avg_score) - Number(b.avg_score))
        .slice(0, 5)
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `Copropriétés en ${nomDept}`,
    address: {
      "@type": "PostalAddress",
      addressRegion: nomDept,
      addressCountry: "FR",
    },
    ...(avgScore != null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgScore,
        bestRating: 100,
        worstRating: 0,
        ratingCount: total,
      },
    }),
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://coproscore.fr" },
      { "@type": "ListItem", position: 2, name: "Départements", item: "https://coproscore.fr/departements" },
      { "@type": "ListItem", position: 3, name: nomDept },
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

      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
            <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-400">
              <Link href="/" className="flex items-center gap-1 transition-colors hover:text-teal-700">
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Accueil</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/departements" className="transition-colors hover:text-teal-700">
                Départements
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-slate-600">{nomDept}</span>
            </nav>

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
                  Copropriétés dans le {nomDept}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  {total.toLocaleString("fr-FR")} copropriété{total > 1 ? "s" : ""} analysée{total > 1 ? "s" : ""} dans{" "}
                  {communes.length} commune{communes.length > 1 ? "s" : ""} — département {codeDept}
                  {avgScore !== null ? ` — score moyen ${avgScore}/100` : ""}
                </p>
              </div>
            </div>

            {/* Summary pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {medianScore !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  Médian <strong>{medianScore}</strong>
                </span>
              )}
              {minScore !== null && maxScore !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  Min–Max <strong>{minScore} — {maxScore}</strong>
                </span>
              )}
              {avgPrixM2 != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  <DollarSign className="h-3 w-3 text-slate-400" />
                  <strong>{avgPrixM2.toLocaleString("fr-FR")} €/m²</strong>
                </span>
              )}
              {dpeMedian && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  <Zap className="h-3 w-3 text-slate-400" />
                  DPE <strong>{dpeMedian}</strong>
                </span>
              )}
              <Link
                href="/carte"
                className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
              >
                <MapPin className="h-3 w-3" />
                Voir sur la carte
              </Link>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Le département {nomDept} ({codeDept}) compte {total.toLocaleString("fr-FR")} copropriétés analysées par CoproScore,
              réparties dans {communes.length} commune{communes.length > 1 ? "s" : ""}.
              {avgScore !== null ? ` Le score de santé moyen est de ${avgScore}/100.` : ""}
              {avgPrixM2 ? ` Le prix moyen au m² est de ${avgPrixM2.toLocaleString("fr-FR")} €.` : ""}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          {/* Santé globale */}
          <section className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Santé globale du département
            </h2>
            <div className="grid items-start gap-4 lg:grid-cols-[1fr_280px]">
              <Card className="border-slate-200 bg-white">
                <CardContent className="py-5">
                  <p className="mb-3 text-xs font-medium text-slate-400">Distribution des scores</p>
                  <ScoreHistogram buckets={buckets} />
                </CardContent>
              </Card>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:gap-3">
                <div className="flex-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-3 text-center">
                  <p className="text-xl font-bold text-teal-700">{bon.toLocaleString("fr-FR")}</p>
                  <p className="text-[11px] text-teal-700/70">Bon (≥ 70) — {total > 0 ? Math.round((bon / total) * 100) : 0}%</p>
                </div>
                <div className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-center">
                  <p className="text-xl font-bold text-amber-600">{moyen.toLocaleString("fr-FR")}</p>
                  <p className="text-[11px] text-amber-600/70">Moyen (40-69) — {total > 0 ? Math.round((moyen / total) * 100) : 0}%</p>
                </div>
                <div className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-center">
                  <p className="text-xl font-bold text-red-600">{attention.toLocaleString("fr-FR")}</p>
                  <p className="text-[11px] text-red-600/70">Attention (&lt; 40) — {total > 0 ? Math.round((attention / total) * 100) : 0}%</p>
                </div>
              </div>
            </div>
            {total > 0 && (
              <div className="mt-4 flex h-2.5 overflow-hidden rounded-full">
                {bon > 0 && <div className="bg-teal-500" style={{ width: `${(bon / total) * 100}%` }} />}
                {moyen > 0 && <div className="bg-amber-400" style={{ width: `${(moyen / total) * 100}%` }} />}
                {attention > 0 && <div className="bg-red-500" style={{ width: `${(attention / total) * 100}%` }} />}
              </div>
            )}
          </section>

          {/* Points clés */}
          <section className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Points clés du département</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className={`rounded-lg border p-3.5 ${syndicInfo.bg === "bg-teal-50" ? "border-teal-200" : syndicInfo.bg === "bg-amber-50" ? "border-amber-200" : "border-orange-200"} ${syndicInfo.bg}`}>
                <div className="mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span className="text-xs text-slate-500">Syndic pro</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{pctSyndicPro != null ? `${pctSyndicPro}%` : "—"}</p>
                <p className={`mt-0.5 text-[11px] font-medium ${syndicInfo.text}`}>{syndicInfo.label}</p>
              </div>
              <div className={`rounded-lg border p-3.5 ${perilInfo.bg === "bg-teal-50" ? "border-teal-200" : perilInfo.bg === "bg-amber-50" ? "border-amber-200" : "border-red-200"} ${perilInfo.bg}`}>
                <div className="mb-2 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-slate-500" />
                  <span className="text-xs text-slate-500">Péril / PDP</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{nbPeril}</p>
                <p className={`mt-0.5 text-[11px] font-medium ${perilInfo.text}`}>{perilInfo.label}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                <div className="mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                  <span className="text-xs text-slate-500">Prix moyen / m²</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{avgPrixM2 ? `${avgPrixM2.toLocaleString("fr-FR")} €` : "—"}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Source DVF 3 ans</p>
              </div>
              <div className={`rounded-lg border p-3.5 ${dpeInfo ? `${dpeInfo.bg} ${dpeInfo.bg === "bg-red-50" ? "border-red-200" : dpeInfo.bg === "bg-orange-50" ? "border-orange-200" : "border-slate-200"}` : "border-slate-200 bg-white"}`}>
                <div className="mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-slate-500" />
                  <span className="text-xs text-slate-500">DPE médian</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{dpeMedian ?? "—"}</p>
                <p className={`mt-0.5 text-[11px] font-medium ${dpeInfo ? dpeInfo.text : "text-slate-400"}`}>{dpeInfo ? dpeInfo.label : "Non disponible"}</p>
              </div>
            </div>
          </section>

          {/* Classement communes */}
          {(top5.length > 0 || worst5.length > 0) && (
            <section className="mb-8">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Classement des communes</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {top5.length > 0 && (
                  <Card className="border-slate-200 bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                        Top 5 meilleures communes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 pt-0">
                      <div className="divide-y divide-slate-100">
                        {top5.map((c, i) => (
                          <Link
                            key={c.code}
                            href={`/ville/${makeVilleSlug(c.nom, c.code)}`}
                            className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-slate-50"
                          >
                            <span className="w-4 text-center text-[11px] font-medium text-slate-400">{i + 1}</span>
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold ${scoreBg(Number(c.avg_score))} ${scoreColor(Number(c.avg_score))}`}>
                              {Number(c.avg_score)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{c.nom}</span>
                            <span className="text-xs text-slate-400">{Number(c.total).toLocaleString("fr-FR")} copros</span>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {worst5.length > 0 && (
                  <Card className="border-slate-200 bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-red-600">
                        <ShieldAlert className="h-4 w-4" />
                        5 communes les plus en difficulté
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 pt-0">
                      <div className="divide-y divide-slate-100">
                        {worst5.map((c) => (
                          <Link
                            key={c.code}
                            href={`/ville/${makeVilleSlug(c.nom, c.code)}`}
                            className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-slate-50"
                          >
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold ${scoreBg(Number(c.avg_score))} ${scoreColor(Number(c.avg_score))}`}>
                              {Number(c.avg_score)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{c.nom}</span>
                            <span className="text-xs text-slate-400">{Number(c.total).toLocaleString("fr-FR")} copros</span>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          )}

          {/* Toutes les communes */}
          <section className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              {communes.length} commune{communes.length > 1 ? "s" : ""} dans le {nomDept}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {communes.map((c) => {
                const avg = c.avg_score != null ? Number(c.avg_score) : null;
                return (
                  <Link
                    key={c.code}
                    href={`/ville/${makeVilleSlug(c.nom, c.code)}`}
                    className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-teal-300 hover:bg-teal-50/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 group-hover:text-teal-700">
                        {c.nom}
                      </p>
                      <p className="text-xs text-slate-400">
                        {Number(c.total).toLocaleString("fr-FR")} copro{Number(c.total) > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="ml-2 flex items-center gap-2">
                      {avg !== null && (
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${scoreBg(avg)} ${scoreColor(avg)}`}>
                          {avg}
                        </span>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* CTA Pro */}
        <section className="border-t bg-gradient-to-r from-teal-700 to-teal-600">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:text-left">
            <Crown className="h-8 w-8 shrink-0 text-teal-200" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-white">
                Besoin d'analyser ce département en profondeur ?
              </p>
              <p className="mt-0.5 text-sm text-teal-100">
                Accédez à toutes les données avec l'offre Pro.
              </p>
            </div>
            <Link href="/tarifs" data-umami-event="pro-cta-click">
              <Button className="bg-white text-teal-700 hover:bg-teal-50">
                Découvrir l'offre Pro →
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
