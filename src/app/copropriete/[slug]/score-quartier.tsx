import { Lock, MapPin } from "lucide-react";
import Link from "next/link";
import type { ScoreQuartier } from "@/lib/score-quartier";

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
    return "Ce quartier pr\u00e9sente un bon niveau de sant\u00e9 des copropri\u00e9t\u00e9s. Les immeubles sont globalement bien entretenus.";
  }
  if (q.scoreMoyen >= 55) {
    return "Quartier correct avec des copropri\u00e9t\u00e9s en \u00e9tat variable. Certains immeubles m\u00e9ritent attention.";
  }
  if (q.scoreMoyen >= 40) {
    return "Quartier mixte, attention aux copropri\u00e9t\u00e9s voisines en difficult\u00e9. V\u00e9rifiez l\u2019\u00e9tat des parties communes.";
  }
  return "Quartier avec de nombreuses copropri\u00e9t\u00e9s en difficult\u00e9. Vigilance accrue recommand\u00e9e.";
}

export function ScoreQuartierSection({ quartier }: { quartier: ScoreQuartier }) {
  const score = Math.round(quartier.scoreMoyen);

  return (
    <section>
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <MapPin className="h-5 w-5 text-teal-600" />
        Score du quartier (rayon {quartier.rayon}m)
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        Agr&eacute;gation des scores de toutes les copropri&eacute;t&eacute;s &agrave; proximit&eacute;
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
              Bas&eacute; sur {quartier.nbCopros} copropri&eacute;t&eacute;
              {quartier.nbCopros > 1 ? "s" : ""} dans un rayon de {quartier.rayon}m
            </p>

            {/* Repartition bar — visible part */}
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
            <div className="mt-1.5 flex gap-3 text-[11px] text-slate-500">
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

        {/* Interpretation — blurred with paywall (unless dev unlocked) */}
        {process.env.NEXT_PUBLIC_DEV_UNLOCK === "true" ? (
          <div className="mt-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-sm leading-relaxed text-slate-600">
                {interpretation(quartier)}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Score m&eacute;dian : {quartier.scoreMedian}/100
              </p>
            </div>
          </div>
        ) : (
          <div className="relative mt-4">
            <div className="select-none blur-sm">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm leading-relaxed text-slate-600">
                  {interpretation(quartier)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Score m&eacute;dian : {quartier.scoreMedian}/100
                </p>
              </div>
            </div>
            <Link
              href="/tarifs"
              className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-white/40 to-white/90 text-sm font-medium text-teal-700 transition-colors hover:text-teal-900"
            >
              <Lock className="h-3.5 w-3.5" />
              Voir l&apos;analyse du quartier &mdash; 4,90&euro;
            </Link>
          </div>
        )}

        {/* Link to carte */}
        <div className="mt-3 text-center">
          <Link
            href="/carte"
            className="text-xs font-medium text-teal-700 underline-offset-2 transition-colors hover:text-teal-900 hover:underline"
          >
            Explorer la carte heatmap des copropri&eacute;t&eacute;s &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
