import { prisma } from "@/lib/prisma";
import { makeVilleSlug } from "@/lib/slug";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Building2, MapPin, Home, ChevronRight } from "lucide-react";
import { scoreColor, scoreBg } from "@/lib/format";

export const metadata: Metadata = {
  title: "Toutes les villes — CoproScore",
  description:
    "Explorez les scores de santé des copropriétés dans les 12 900+ communes de France. Classement par département avec score moyen et nombre de copropriétés.",
};

interface VilleRow {
  code: string;
  nom: string;
  code_dept: string;
  nom_dept: string;
  total: bigint;
  avg_score: number | null;
}

export default async function VillesPage() {
  const villes = await prisma.$queryRawUnsafe<VilleRow[]>(
    `SELECT
       code_officiel_commune as code,
       INITCAP(MODE() WITHIN GROUP (ORDER BY nom_officiel_commune)) as nom,
       MODE() WITHIN GROUP (ORDER BY code_officiel_departement) as code_dept,
       MODE() WITHIN GROUP (ORDER BY nom_officiel_departement) as nom_dept,
       COUNT(*) as total,
       ROUND(AVG(score_global)) as avg_score
     FROM coproprietes
     WHERE code_officiel_commune IS NOT NULL
       AND nom_officiel_commune IS NOT NULL
     GROUP BY code_officiel_commune
     ORDER BY code_dept, nom`
  );

  // Group by département
  const deptMap = new Map<
    string,
    { code: string; nom: string; villes: VilleRow[] }
  >();
  for (const v of villes) {
    if (!deptMap.has(v.code_dept)) {
      deptMap.set(v.code_dept, {
        code: v.code_dept,
        nom: v.nom_dept,
        villes: [],
      });
    }
    deptMap.get(v.code_dept)!.villes.push(v);
  }
  const departements = Array.from(deptMap.values());

  const totalVilles = villes.length;
  const totalCopros = villes.reduce((s, v) => s + Number(v.total), 0);

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
              <span className="text-slate-600">Toutes les villes</span>
            </nav>

            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Copropriétés par ville en France
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {totalVilles.toLocaleString("fr-FR")} communes et{" "}
              {totalCopros.toLocaleString("fr-FR")} copropriétés analysées,
              réparties dans {departements.length} départements. Sélectionnez
              une ville pour consulter les scores détaillés de ses copropriétés.
            </p>

            {/* Quick navigation */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {departements.map((d) => (
                <a
                  key={d.code}
                  href={`#dept-${d.code}`}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                >
                  {d.code}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Départements listing */}
        <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
          {departements.map((dept) => (
            <section key={dept.code} id={`dept-${dept.code}`} className="mb-8">
              <div className="sticky top-0 z-10 -mx-4 mb-3 border-b border-slate-200 bg-[#fafbfc]/95 px-4 py-2 backdrop-blur-sm">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  {dept.nom}
                  <span className="text-sm font-normal text-slate-400">
                    ({dept.code}) — {dept.villes.length} commune
                    {dept.villes.length > 1 ? "s" : ""}
                  </span>
                </h2>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {dept.villes.map((v) => (
                  <Link
                    key={v.code}
                    href={`/ville/${makeVilleSlug(v.nom, v.code)}`}
                    className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-teal-300 hover:bg-teal-50/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 group-hover:text-teal-700">
                        {v.nom}
                      </p>
                      <p className="text-xs text-slate-400">
                        {Number(v.total).toLocaleString("fr-FR")} copro
                        {Number(v.total) > 1 ? "s" : ""}
                      </p>
                    </div>
                    {v.avg_score != null && (
                      <span
                        className={`ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${scoreBg(Number(v.avg_score))} ${scoreColor(Number(v.avg_score))}`}
                      >
                        {Number(v.avg_score)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
