"use client";

import { useEffect, useState } from "react";
import { Lock, CheckCircle2, AlertTriangle, Lightbulb, Sparkles } from "lucide-react";
import Link from "next/link";
import type { AccessLevel } from "@/lib/access";

interface AnalyseResult {
  points_forts: string[];
  vigilances: string[];
  recommandations: string[];
  resume: string;
}

interface AnalyseResponse {
  analyse: AnalyseResult;
  generatedAt: string;
  cached: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ShimmerBar({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded bg-teal-100/60 ${className ?? ""}`}>
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-200/50 to-transparent"
        style={{ animation: "shimmer 2s infinite" }}
      />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <ShimmerBar className="h-24 rounded-lg" />
      <div className="space-y-3">
        <ShimmerBar className="h-4 w-2/3" />
        <ShimmerBar className="h-4 w-5/6" />
        <ShimmerBar className="h-4 w-3/4" />
      </div>
      <div className="space-y-3">
        <ShimmerBar className="h-4 w-3/5" />
        <ShimmerBar className="h-4 w-4/5" />
      </div>
      <p className="flex items-center justify-center gap-2 text-sm text-teal-600">
        <Sparkles className="h-4 w-4 animate-pulse" />
        Analyse en cours de génération…
      </p>
    </div>
  );
}

export function AnalyseIA({ slug, accessLevel }: { slug: string; accessLevel: AccessLevel }) {
  const [data, setData] = useState<AnalyseResponse | null>(null);
  const [loading, setLoading] = useState(accessLevel === "pro");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessLevel !== "pro") return;

    let cancelled = false;

    async function fetchAnalyse() {
      try {
        const res = await fetch(`/api/copropriete/${slug}/analyse`);
        if (!res.ok) {
          if (res.status === 429) {
            setError("Analyse temporairement indisponible. Réessayez dans quelques instants.");
          } else {
            setError("Impossible de charger l'analyse.");
          }
          return;
        }
        const json = (await res.json()) as AnalyseResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Erreur de connexion.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalyse();
    return () => { cancelled = true; };
  }, [slug, accessLevel]);

  // Free users: attractive blurred placeholder with CTA
  if (accessLevel === "free") {
    return (
      <section className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-slate-50 p-6">
        {/* Badge */}
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white">
            <Sparkles className="h-3 w-3" />
            Analyse IA
          </span>
        </div>
        <h2 className="mb-0.5 text-xl font-bold text-slate-900">
          Analyse CoproScore
        </h2>
        <p className="mb-5 text-sm font-medium text-teal-600">
          Générée par intelligence artificielle
        </p>

        {/* Blurred fake content */}
        <div className="relative">
          <div className="select-none space-y-3 blur-sm" aria-hidden="true">
            <div className="rounded-lg border border-teal-100 bg-white/80 p-4">
              <p className="text-base leading-relaxed text-slate-700">
                Cette copropriété présente un profil globalement positif avec une bonne gestion
                et un entretien régulier. Quelques points de vigilance sont à noter concernant
                la performance énergétique du bâtiment.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                Points forts
              </h3>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                  Syndic professionnel avec bonne gouvernance
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                  Marché immobilier dynamique dans le secteur
                </li>
              </ul>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg bg-gradient-to-b from-white/30 via-white/70 to-white/90">
            <p className="text-sm font-medium text-slate-700">
              Débloquez l'analyse complète de cette copropriété
            </p>
            <Link
              href="/tarifs"
              className="group inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-200 transition-all hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-200"
            >
              <Lock className="h-4 w-4 text-teal-200 transition-transform group-hover:scale-110" />
              Passer Pro — Découvrir les offres
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Visitor: don't render at all (handled in parent)
  // Pro: full access
  return (
    <section className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-slate-50 p-6">
      {/* Badge */}
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white">
          <Sparkles className="h-3 w-3" />
          Analyse IA
        </span>
      </div>
      <h2 className="mb-0.5 text-xl font-bold text-slate-900">
        Analyse CoproScore
      </h2>
      <p className="mb-5 text-sm font-medium text-teal-600">
        Générée par intelligence artificielle
      </p>

      {loading && <Skeleton />}

      {error && (
        <p className="text-xs text-slate-400">Analyse indisponible</p>
      )}

      {data && (
        <div className="space-y-4">
          {/* Resume */}
          <div className="rounded-lg border border-teal-100 bg-white/80 p-4">
            <p className="text-base leading-relaxed text-slate-700">{data.analyse.resume}</p>
          </div>

          <div className="space-y-3">
            {/* Points forts */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                Points forts
              </h3>
              <ul className="space-y-1.5">
                {data.analyse.points_forts.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-base leading-relaxed text-slate-700">
                    <span className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Vigilances */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Points de vigilance
              </h3>
              <ul className="space-y-1.5">
                {data.analyse.vigilances.map((v, i) => (
                  <li key={i} className="flex items-start gap-2 text-base leading-relaxed text-slate-700">
                    <span className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {v}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommandations */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Lightbulb className="h-4 w-4 text-blue-500" />
                Recommandations
              </h3>
              <ul className="space-y-1.5">
                {data.analyse.recommandations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-base leading-relaxed text-slate-700">
                    <span className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="text-[11px] text-slate-400">
              Dernière analyse : {formatDate(data.generatedAt)}
            </p>
            <p className="min-w-0 text-[11px] text-slate-400">
              Cette analyse est générée automatiquement à partir de données publiques. Elle ne constitue pas un avis professionnel.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
