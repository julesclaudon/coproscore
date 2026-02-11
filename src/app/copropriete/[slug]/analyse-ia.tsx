"use client";

import { useEffect, useState } from "react";
import { Lock, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";
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

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-20 rounded-lg bg-teal-50" />
      <div className="space-y-3">
        <div className="h-4 w-2/3 rounded bg-slate-100" />
        <div className="h-4 w-5/6 rounded bg-slate-100" />
        <div className="h-4 w-3/4 rounded bg-slate-100" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-3/5 rounded bg-slate-100" />
        <div className="h-4 w-4/5 rounded bg-slate-100" />
      </div>
      <p className="text-center text-sm text-slate-400">
        Analyse en cours de g&eacute;n&eacute;ration...
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

  // Free users: show placeholder
  if (accessLevel === "free") {
    return (
      <section>
        <h2 className="mb-1 text-lg font-semibold text-slate-900">
          Analyse CoproScore
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          G&eacute;n&eacute;r&eacute;e par intelligence artificielle &agrave; partir des donn&eacute;es publiques
        </p>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-8 text-center">
          <Lock className="h-6 w-6 text-slate-400" />
          <p className="text-sm font-medium text-slate-700">
            Disponible avec l&apos;abonnement Pro
          </p>
          <Link
            href="/tarifs"
            className="text-sm font-medium text-teal-700 transition-colors hover:text-teal-900"
          >
            D&eacute;couvrir les offres &rarr;
          </Link>
        </div>
      </section>
    );
  }

  // Visitor: don't render at all (handled in parent)
  // Pro: full access
  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold text-slate-900">
        Analyse CoproScore
      </h2>
      <p className="mb-4 text-xs text-slate-400">
        G&eacute;n&eacute;r&eacute;e par intelligence artificielle &agrave; partir des donn&eacute;es publiques
      </p>

      {loading && <Skeleton />}

      {error && (
        <p className="text-xs text-slate-400">Analyse indisponible</p>
      )}

      {data && (
        <div className="space-y-4">
          {/* Resume */}
          <div className="rounded-lg border border-teal-100 bg-teal-50/60 p-4">
            <p className="text-sm leading-relaxed text-slate-700">{data.analyse.resume}</p>
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
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
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
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
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
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="text-[11px] text-slate-400">
              Derni&egrave;re analyse : {formatDate(data.generatedAt)}
            </p>
            <p className="min-w-0 text-[11px] text-slate-400">
              Cette analyse est g&eacute;n&eacute;r&eacute;e automatiquement &agrave; partir de donn&eacute;es publiques. Elle ne constitue pas un avis professionnel.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
