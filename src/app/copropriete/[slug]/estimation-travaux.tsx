import { Lock, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { EstimationTravaux } from "@/lib/budget-travaux";
import type { AccessLevel } from "@/lib/access";

function fmtEur(n: number): string {
  return Math.round(n).toLocaleString("fr-FR") + " €";
}

function FiabiliteBadge({ fiabilite }: { fiabilite: EstimationTravaux["fiabilite"] }) {
  if (fiabilite === "haute") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
        <CheckCircle2 className="h-3 w-3" />
        Estimation fiable
      </span>
    );
  }
  if (fiabilite === "moyenne") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        <AlertTriangle className="h-3 w-3" />
        Estimation approximative
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
      <ShieldAlert className="h-3 w-3" />
      Données insuffisantes
    </span>
  );
}

function PosteCard({
  nom,
  description,
  min,
  max,
  totalMax,
}: {
  nom: string;
  description: string;
  min: number;
  max: number;
  totalMax: number;
}) {
  const pct = totalMax > 0 ? Math.round((max / totalMax) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{nom}</p>
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        </div>
        <p className="text-sm font-bold text-slate-900 sm:shrink-0 sm:text-right">
          {fmtEur(min)} — {fmtEur(max)}
        </p>
      </div>
      <div className="mt-3 h-1.5 max-w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>
    </div>
  );
}

export function EstimationTravauxSection({
  estimation,
  nbLots,
  accessLevel,
}: {
  estimation: EstimationTravaux;
  nbLots: number | null;
  accessLevel: AccessLevel;
}) {
  const { postes, totalMin, totalMax, fiabilite } = estimation;
  const lots = nbLots ?? 1;

  // No postes — good condition
  if (postes.length === 0) {
    return (
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
          Estimation des travaux potentiels
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Fourchette estimée à partir de la période de construction, du DPE et des moyennes nationales (ANAH/ADEME)
        </p>
        <div className="flex items-center gap-3 rounded-lg border border-teal-200 bg-teal-50/60 p-5">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-teal-600" />
          <div>
            <p className="text-sm font-medium text-teal-800">
              Aucun poste de travaux majeur identifié
            </p>
            <p className="mt-0.5 text-xs text-teal-600">
              La copropriété semble en bon état technique.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Sort postes by max descending for display
  const sorted = [...postes].sort((a, b) => b.max - a.max);

  // Determine visible postes based on access level
  const visiblePostes = accessLevel === "pro" ? sorted : sorted.slice(0, 1);
  const hiddenPostes = accessLevel === "pro" ? [] : sorted.slice(1);

  const ctaHref = accessLevel === "visitor" ? "/inscription" : "/tarifs";
  const ctaText = accessLevel === "visitor"
    ? "Créez un compte gratuit pour voir le détail"
    : "Passez Pro pour voir le détail";

  return (
    <section className="rounded-2xl bg-amber-50/50 p-5 sm:p-6">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
        Estimation des travaux potentiels
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Fourchette estimée à partir de la période de construction, du DPE et des moyennes nationales (ANAH/ADEME)
      </p>

      <div className="space-y-3">
        {/* Visible postes */}
        {visiblePostes.map((p, i) => (
          <PosteCard
            key={i}
            nom={p.nom}
            description={p.description}
            min={p.min}
            max={p.max}
            totalMax={totalMax}
          />
        ))}

        {/* Hidden postes — blurred with paywall */}
        {hiddenPostes.length > 0 && (
          <div className="relative">
            <div className="select-none space-y-3 blur-sm" aria-hidden="true">
              {hiddenPostes.map((p, i) => (
                <PosteCard
                  key={i}
                  nom={p.nom}
                  description={p.description}
                  min={p.min}
                  max={p.max}
                  totalMax={totalMax}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-b from-white/40 to-white/90">
              <Link
                href={ctaHref}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
              >
                <Lock className="h-4 w-4 text-teal-200" />
                {ctaText}
              </Link>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-2">
            <p className="text-sm font-medium text-slate-600">Total estimé</p>
            <p className="break-words text-xl font-bold text-slate-900">
              {fmtEur(totalMin)} — {fmtEur(totalMax)}
            </p>
          </div>
          {lots > 1 && (
            <p className="mt-1 break-words text-right text-xs text-slate-400">
              soit {fmtEur(Math.round(totalMin / lots))} —{" "}
              {fmtEur(Math.round(totalMax / lots))} par lot
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <FiabiliteBadge fiabilite={fiabilite} />
            <p className="text-[11px] text-slate-400">
              Moyennes ANAH/ADEME, ne remplace pas un devis
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
