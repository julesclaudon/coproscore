import { prisma } from "@/lib/prisma";
import { makeDeptSlug } from "@/lib/slug";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MapPin, Home, ChevronRight, Building2, ArrowRight } from "lucide-react";
import { scoreColor, scoreBg } from "@/lib/format";

export const metadata: Metadata = {
  title: "Copropriétés par département en France — CoproScore",
  description:
    "Explorez les scores de santé des copropriétés dans les 101 départements français. Nombre de copropriétés, score moyen et classement par département.",
};

interface DeptRow {
  code_dept: string;
  nom_dept: string;
  nb_communes: bigint;
  total: bigint;
  avg_score: number | null;
}

export default async function VillesPage() {
  const depts = await prisma.$queryRawUnsafe<DeptRow[]>(
    `SELECT
       code_officiel_departement as code_dept,
       MODE() WITHIN GROUP (ORDER BY nom_officiel_departement) as nom_dept,
       COUNT(DISTINCT code_officiel_commune) as nb_communes,
       COUNT(*) as total,
       ROUND(AVG(score_global)) as avg_score
     FROM coproprietes
     WHERE code_officiel_departement IS NOT NULL
       AND nom_officiel_departement IS NOT NULL
     GROUP BY code_officiel_departement
     ORDER BY code_officiel_departement`
  );

  const totalCopros = depts.reduce((s, d) => s + Number(d.total), 0);
  const totalCommunes = depts.reduce((s, d) => s + Number(d.nb_communes), 0);

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
              <span className="text-slate-600">Départements</span>
            </nav>

            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Copropriétés par département en France
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {totalCopros.toLocaleString("fr-FR")} copropriétés analysées dans{" "}
              {totalCommunes.toLocaleString("fr-FR")} communes, réparties dans{" "}
              {depts.length} départements. Sélectionnez un département pour
              découvrir les communes et leurs scores.
            </p>
          </div>
        </section>

        {/* Départements grid */}
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {depts.map((d) => {
              const avg = d.avg_score != null ? Number(d.avg_score) : null;
              return (
                <Link
                  key={d.code_dept}
                  href={`/villes/${makeDeptSlug(d.nom_dept, d.code_dept)}`}
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 transition-colors hover:border-teal-300 hover:bg-teal-50/30"
                >
                  {avg !== null ? (
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${scoreBg(avg)} ${scoreColor(avg)}`}
                    >
                      {avg}
                    </span>
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-400">
                      —
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-teal-700">
                      {d.nom_dept}
                      <span className="ml-1.5 font-normal text-slate-400">
                        ({d.code_dept})
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {Number(d.total).toLocaleString("fr-FR")} copro
                      {Number(d.total) > 1 ? "s" : ""} ·{" "}
                      {Number(d.nb_communes).toLocaleString("fr-FR")} commune
                      {Number(d.nb_communes) > 1 ? "s" : ""}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" />
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
