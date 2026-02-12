import { Lock, MapPin } from "lucide-react";
import Link from "next/link";
import type { ScoreQuartier } from "@/lib/score-quartier";
import type { AccessLevel } from "@/lib/access";

function scoreColor(score: number): string {
  if (score >= 70) return "text-teal-600";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

function scoreBgRing(score: number): string {
  if (score >= 70) return "border-teal-200 bg-teal-50";
  if (score >= 40) return "border-amber-200 bg-amber-50";
  return "border-red-200 bg-red-50";
}

function interpretation(q: ScoreQuartier): string {
  if (q.scoreMoyen >= 70) {
    return "Ce quartier présente un bon niveau de santé des copropriétés. Les immeubles sont globalement bien entretenus.";
  }
  if (q.scoreMoyen >= 55) {
    return "Quartier correct avec des copropriétés en état variable. Certains immeubles méritent attention.";
  }
  if (q.scoreMoyen >= 40) {
    return "Quartier mixte, attention aux copropriétés voisines en difficulté. Vérifiez l’état des parties communes.";
  }
  return "Quartier avec de nombreuses copropriétés en difficulté. Vigilance accrue recommandée.";
}

export function ScoreQuartierSection({
  quartier,
  accessLevel,
}: {
  quartier: ScoreQuartier;
  accessLevel: AccessLevel;
}) {
  const score = Math.round(quartier.scoreMoyen);
  const isLocked = accessLevel !== "pro";
  const ctaHref = accessLevel === "visitor" ? "/inscription" : "/tarifs";
  const ctaText = accessLevel === "visitor"
    ? "Créez un compte pour voir l'analyse"
    : "Passez Pro pour voir l'analyse";

  return (
    <section>
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <MapPin className="h-5 w-5 text-teal-600" />
        Score du quartier (rayon {quartier.rayon}m)
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        Agrégation des scores de toutes les copropriétés à proximité
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-5">
          {/* Score circle */}
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 ${scoreBgRing(score)}`}
          >
            <span className={`text-2xl font-bold ${scoreColor(score)}`}>
              {score}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700">
              Score moyen du quartier
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Basé sur {quartier.nbCopros} copropriété
              {quartier.nbCopros > 1 ? "s" : ""} dans un rayon de {quartier.rayon}m
            </p>

            {/* Repartition bar */}
            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full">
              {quartier.pctBon > 0 && (
                <div
                  className="bg-teal-500"
                  style={{ width: `${quartier.pctBon}%` }}
                  title={`${quartier.pctBon}% Bon`}
                />
              )}
              {quartier.pctMoyen > 0 && (
                <div
                  className="bg-amber-400"
                  style={{ width: `${quartier.pctMoyen}%` }}
                  title={`${quartier.pctMoyen}% Moyen`}
                />
              )}
              {quartier.pctAttention > 0 && (
                <div
                  className="bg-red-400"
                  style={{ width: `${quartier.pctAttention}%` }}
                  title={`${quartier.pctAttention}% Attention`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-teal-500" />
                {quartier.pctBon}% Bon
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                {quartier.pctMoyen}% Moyen
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                {quartier.pctAttention}% Attention
              </span>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        {isLocked ? (
          <div className="relative mt-4">
            <div className="select-none blur-sm" aria-hidden="true">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm leading-relaxed text-slate-600">
                  {interpretation(quartier)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Score médian : {quartier.scoreMedian}/100
                </p>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-b from-white/40 to-white/90">
              <Link
                href={ctaHref}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
              >
                <Lock className="h-3.5 w-3.5 text-teal-200" />
                {ctaText}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-sm leading-relaxed text-slate-600">
                {interpretation(quartier)}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Score médian : {quartier.scoreMedian}/100
              </p>
            </div>
          </div>
        )}

        {/* Link to carte */}
        <div className="mt-3 text-center">
          <Link
            href="/carte"
            className="text-xs font-medium text-teal-700 underline-offset-2 transition-colors hover:text-teal-900 hover:underline"
          >
            Explorer la carte heatmap des copropriétés →
          </Link>
        </div>
      </div>
    </section>
  );
}
