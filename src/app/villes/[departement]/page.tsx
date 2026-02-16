import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { makeVilleSlug, parseDeptSlug } from "@/lib/slug";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Home, ChevronRight, ArrowRight } from "lucide-react";
import { scoreColor, scoreBg } from "@/lib/format";

/* ---------- Types ---------- */

interface DeptInfo {
  code_dept: string;
  nom_dept: string;
  total: bigint;
  avg_score: number | null;
}

interface CommuneRow {
  code: string;
  nom: string;
  total: bigint;
  avg_score: number | null;
}

/* ---------- Metadata ---------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ departement: string }>;
}): Promise<Metadata> {
  const { departement } = await params;
  const codeDept = parseDeptSlug(departement);
  if (!codeDept) return {};

  const [info] = await prisma.$queryRawUnsafe<DeptInfo[]>(
    `SELECT
       code_officiel_departement as code_dept,
       MODE() WITHIN GROUP (ORDER BY nom_officiel_departement) as nom_dept,
       COUNT(*) as total,
       ROUND(AVG(score_global)) as avg_score
     FROM coproprietes
     WHERE code_officiel_departement = $1
     GROUP BY code_officiel_departement`,
    codeDept
  );
  if (!info) return {};

  const nbCommunes = await prisma.$queryRawUnsafe<[{ n: bigint }]>(
    `SELECT COUNT(DISTINCT code_officiel_commune) as n
     FROM coproprietes
     WHERE code_officiel_departement = $1
       AND code_officiel_commune IS NOT NULL`,
    codeDept
  );

  const communes = Number(nbCommunes[0].n);
  const scoreText =
    info.avg_score != null ? ` Score moyen ${info.avg_score}/100.` : "";

  return {
    title: `Copropriétés en ${info.nom_dept} (${codeDept}) — ${communes} communes — CoproScore`,
    description: `Découvrez les ${Number(info.total).toLocaleString("fr-FR")} copropriétés dans ${communes} communes du département ${info.nom_dept}.${scoreText} Scores détaillés par commune.`,
  };
}

/* ---------- Page ---------- */

export default async function DepartementPage({
  params,
}: {
  params: Promise<{ departement: string }>;
}) {
  const { departement } = await params;
  const codeDept = parseDeptSlug(departement);
  if (!codeDept) notFound();

  const [info] = await prisma.$queryRawUnsafe<DeptInfo[]>(
    `SELECT
       code_officiel_departement as code_dept,
       MODE() WITHIN GROUP (ORDER BY nom_officiel_departement) as nom_dept,
       COUNT(*) as total,
       ROUND(AVG(score_global)) as avg_score
     FROM coproprietes
     WHERE code_officiel_departement = $1
     GROUP BY code_officiel_departement`,
    codeDept
  );
  if (!info) notFound();

  const communes = await prisma.$queryRawUnsafe<CommuneRow[]>(
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
     ORDER BY nom`,
    codeDept
  );

  const nomDept = info.nom_dept;
  const totalCopros = Number(info.total);
  const avgScore = info.avg_score != null ? Number(info.avg_score) : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#fafbfc]">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
            <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-400">
              <Link
                href="/"
                className="flex items-center gap-1 transition-colors hover:text-teal-700"
              >
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Accueil</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link
                href="/villes"
                className="transition-colors hover:text-teal-700"
              >
                Départements
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-slate-600">{nomDept}</span>
            </nav>

            <div className="flex items-center gap-5">
              {avgScore !== null && (
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold sm:h-20 sm:w-20 sm:text-2xl ${scoreBg(avgScore)} ${scoreColor(avgScore)}`}
                >
                  {avgScore}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-slate-900 sm:text-2xl">
                  Copropriétés en {nomDept} — {communes.length} ville
                  {communes.length > 1 ? "s" : ""}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {totalCopros.toLocaleString("fr-FR")} copropriété
                  {totalCopros > 1 ? "s" : ""} analysée
                  {totalCopros > 1 ? "s" : ""} dans le département{" "}
                  {nomDept} ({codeDept})
                  {avgScore !== null
                    ? ` — score moyen ${avgScore}/100`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Communes grid */}
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
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
                      {Number(c.total).toLocaleString("fr-FR")} copro
                      {Number(c.total) > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="ml-2 flex items-center gap-2">
                    {avg !== null && (
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${scoreBg(avg)} ${scoreColor(avg)}`}
                      >
                        {avg}
                      </span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
