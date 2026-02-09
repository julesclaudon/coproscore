import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { makeVilleSlug, parseVilleSlug } from "@/lib/slug";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import {
  Building2,
  MapPin,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export const revalidate = 86400;

// ISR on-demand generation — ville pages generated on first request, cached 24h.
// Sitemap.xml lists all ville URLs for search engine discovery.
export async function generateStaticParams() {
  return [];
}

interface VilleStats {
  total: bigint;
  avg_score: number | null;
  bon: bigint;
  moyen: bigint;
  attention: bigint;
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
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const codeCommune = parseVilleSlug(slug);
  if (!codeCommune) return {};

  const [info] = await prisma.$queryRawUnsafe<
    { nom: string; code: string; total: bigint; avg_score: number | null }[]
  >(
    `SELECT nom_officiel_commune as nom, code_officiel_commune as code,
            COUNT(*) as total, ROUND(AVG(score_global)) as avg_score
     FROM coproprietes
     WHERE code_officiel_commune = $1
     GROUP BY nom_officiel_commune, code_officiel_commune`,
    codeCommune
  );

  if (!info) return {};

  return {
    title: `Copropri\u00e9t\u00e9s \u00e0 ${info.nom} - CoproScore`,
    description: `${Number(info.total)} copropri\u00e9t\u00e9s analys\u00e9es \u00e0 ${info.nom}. Score moyen : ${info.avg_score ?? "N/A"}/100. Consultez les scores de sant\u00e9 de toutes les copropri\u00e9t\u00e9s de la commune.`,
    openGraph: {
      title: `Copropri\u00e9t\u00e9s \u00e0 ${info.nom}`,
      description: `${Number(info.total)} copropri\u00e9t\u00e9s, score moyen ${info.avg_score ?? "N/A"}/100.`,
    },
  };
}

function scoreColor(score: number | null) {
  if (score === null) return "text-slate-400";
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

function scoreBg(score: number | null) {
  if (score === null) return "bg-slate-100";
  if (score >= 70) return "bg-emerald-50";
  if (score >= 40) return "bg-amber-50";
  return "bg-red-50";
}

export default async function VillePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const codeCommune = parseVilleSlug(slug);
  if (!codeCommune) notFound();

  // Fetch stats
  const statsRows = await prisma.$queryRawUnsafe<VilleStats[]>(
    `SELECT
       COUNT(*) as total,
       ROUND(AVG(score_global)) as avg_score,
       COUNT(*) FILTER (WHERE score_global >= 70) as bon,
       COUNT(*) FILTER (WHERE score_global >= 40 AND score_global < 70) as moyen,
       COUNT(*) FILTER (WHERE score_global < 40) as attention
     FROM coproprietes
     WHERE code_officiel_commune = $1`,
    codeCommune
  );

  const stats = statsRows[0];
  if (!stats || Number(stats.total) === 0) notFound();

  // Fetch commune name
  const [nameRow] = await prisma.$queryRawUnsafe<
    { nom: string; code: string }[]
  >(
    `SELECT DISTINCT nom_officiel_commune as nom, code_officiel_commune as code
     FROM coproprietes
     WHERE code_officiel_commune = $1 AND nom_officiel_commune IS NOT NULL
     LIMIT 1`,
    codeCommune
  );

  if (!nameRow) notFound();
  const communeName = nameRow.nom;

  // Fetch all copros sorted by score
  const copros = await prisma.$queryRawUnsafe<CoproRow[]>(
    `SELECT id, slug, adresse_reference, nom_usage, code_postal,
            score_global, nb_lots_habitation, type_syndic
     FROM coproprietes
     WHERE code_officiel_commune = $1
     ORDER BY score_global DESC NULLS LAST, id ASC`,
    codeCommune
  );

  const total = Number(stats.total);
  const bon = Number(stats.bon);
  const moyen = Number(stats.moyen);
  const attention = Number(stats.attention);

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
            {communeName}
          </span>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-slate-50 to-white py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h1 className="text-3xl font-bold text-slate-900">
              Copropri&eacute;t&eacute;s &agrave; {communeName}
            </h1>
            <p className="mt-2 text-slate-500">
              {total.toLocaleString("fr-FR")} copropri&eacute;t&eacute;
              {total > 1 ? "s" : ""} analys&eacute;e{total > 1 ? "s" : ""} dans
              la commune
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-10">
          {/* Stats cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-4">
            <Card className="border-slate-200">
              <CardContent className="py-5 text-center">
                <p className="text-3xl font-bold text-slate-900">
                  {stats.avg_score ?? "—"}
                </p>
                <p className="mt-1 text-xs text-slate-400">Score moyen</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="py-5 text-center">
                <p className="text-3xl font-bold text-emerald-600">{bon}</p>
                <p className="mt-1 text-xs text-emerald-600/70">
                  Bon (&ge; 70)
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-5 text-center">
                <p className="text-3xl font-bold text-amber-600">{moyen}</p>
                <p className="mt-1 text-xs text-amber-600/70">
                  Moyen (40-69)
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-5 text-center">
                <p className="text-3xl font-bold text-red-600">{attention}</p>
                <p className="mt-1 text-xs text-red-600/70">
                  Attention (&lt; 40)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Distribution bar */}
          {total > 0 && (
            <div className="mb-10">
              <p className="mb-2 text-sm font-medium text-slate-500">
                R&eacute;partition des scores
              </p>
              <div className="flex h-3 overflow-hidden rounded-full">
                {bon > 0 && (
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${(bon / total) * 100}%` }}
                  />
                )}
                {moyen > 0 && (
                  <div
                    className="bg-amber-400"
                    style={{ width: `${(moyen / total) * 100}%` }}
                  />
                )}
                {attention > 0 && (
                  <div
                    className="bg-red-500"
                    style={{ width: `${(attention / total) * 100}%` }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Copros list */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Toutes les copropri&eacute;t&eacute;s
              </CardTitle>
              <p className="text-xs text-slate-400">
                Tri&eacute;es par score d&eacute;croissant
              </p>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {copros.map((c) => (
                  <Link
                    key={c.id}
                    href={`/copropriete/${c.slug ?? c.id}`}
                    className="group flex items-center gap-4 py-3 transition-colors hover:bg-slate-50 first:pt-0 last:pb-0"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${scoreBg(c.score_global)} ${scoreColor(c.score_global)}`}
                    >
                      {c.score_global ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {c.nom_usage || c.adresse_reference || "Copropri\u00e9t\u00e9"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {c.code_postal && <span>{c.code_postal}</span>}
                        {c.nb_lots_habitation != null && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {c.nb_lots_habitation} lots
                          </span>
                        )}
                        {c.type_syndic && <span>{c.type_syndic}</span>}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-emerald-500" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
