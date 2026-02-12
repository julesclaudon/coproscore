"use client";

import { Suspense, lazy } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SkeletonCard, SkeletonMapPlaceholder } from "@/components/skeleton-card";
import { formatCoproName } from "@/lib/utils";
import { scoreColor, scoreBg } from "@/lib/format";
import { formatPeriod } from "@/lib/format";
import {
  Building2,
  MapPin,
  ArrowRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SearchX,
} from "lucide-react";
import { FavoriteToggle } from "@/components/favorite-toggle";

const SearchMap = lazy(() => import("@/components/search-map"));

interface SearchResult {
  id: number;
  slug: string | null;
  adresse: string | null;
  commune: string | null;
  codePostal: string | null;
  nomUsage: string | null;
  scoreGlobal: number | null;
  nbLots: number | null;
  longitude: number | null;
  latitude: number | null;
  distance: number | null;
  typeSyndic: string | null;
  periodeConstruction: string | null;
}

type SortKey = "pertinence" | "score_desc" | "score_asc" | "distance" | "lots";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "pertinence", label: "Pertinence" },
  { key: "score_desc", label: "Score ↓" },
  { key: "score_asc", label: "Score ↑" },
  { key: "distance", label: "Distance" },
  { key: "lots", label: "Lots" },
];

const SYNDIC_BADGES: Record<string, string> = {
  Professionnel: "bg-teal-100 text-teal-700",
  "Coopératif": "bg-indigo-100 text-indigo-700",
  "Bénévole": "bg-amber-100 text-amber-700",
};

function RechercheContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";
  const lat = searchParams.get("lat") || "";
  const lon = searchParams.get("lon") || "";
  const tri = (searchParams.get("tri") as SortKey) || "pertinence";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const fetchResults = useCallback(async () => {
    if (!q && !lat) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (lat) params.set("lat", lat);
      if (lon) params.set("lon", lon);
      params.set("sort", tri);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [q, lat, lon, tri, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  function pushParams(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (lat) params.set("lat", lat);
    if (lon) params.set("lon", lon);
    params.set("tri", tri);
    params.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      params.set(k, v);
    }
    router.push(`/recherche?${params.toString()}`);
  }

  function handleSort(key: SortKey) {
    pushParams({ tri: key, page: "1" });
  }

  function handlePage(p: number) {
    pushParams({ page: String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNewSearch(v: { label: string; lon: number; lat: number }) {
    const params = new URLSearchParams({
      q: v.label,
      lat: v.lat.toString(),
      lon: v.lon.toString(),
    });
    router.push(`/recherche?${params.toString()}`);
  }

  function handleFreetext(text: string) {
    const params = new URLSearchParams({ q: text });
    router.push(`/recherche?${params.toString()}`);
  }

  const mappableResults = results.filter(
    (r): r is SearchResult & { latitude: number; longitude: number } =>
      r.latitude != null && r.longitude != null
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Sticky header */}
      <Header
        rightSlot={
          <AddressAutocomplete
            defaultValue={q}
            onSelect={handleNewSearch}
            onSubmit={handleFreetext}
            placeholder="Adresse, ville ou code postal..."
          />
        }
      />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
          {/* Results header */}
          {!loading && total > 0 && (
            <p className="mb-4 text-sm font-medium text-slate-500">
              {total.toLocaleString("fr-FR")} copropriété
              {total > 1 ? "s" : ""} trouvée{total > 1 ? "s" : ""}
              {q && (
                <> près de <span className="text-slate-700">{q}</span></>
              )}
            </p>
          )}

          {/* Sort bar */}
          {total > 0 && (
            <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ArrowUpDown className="h-4 w-4 shrink-0 text-slate-400" />
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleSort(opt.key)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    tri === opt.key
                      ? "bg-teal-100 text-teal-700"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col gap-3">
              <SkeletonMapPlaceholder />
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && total === 0 && q && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <SearchX className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-700">
                Aucun résultat pour « {q} »
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Vérifiez l'orthographe ou essayez une autre adresse.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {[
                  { label: "Paris 75001", q: "Paris 75001" },
                  { label: "Lyon 69001", q: "Lyon 69001" },
                  { label: "Marseille 13001", q: "Marseille 13001" },
                ].map((s) => (
                  <button
                    key={s.q}
                    onClick={() => router.push(`/recherche?q=${encodeURIComponent(s.q)}`)}
                    className="rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Map — lazy loaded only when results exist */}
          {!loading && mappableResults.length > 0 && (
            <Suspense fallback={<SkeletonMapPlaceholder />}>
              <div className="mb-6">
                <SearchMap
                  results={mappableResults.map((r) => ({
                    id: r.id,
                    slug: r.slug,
                    label: formatCoproName(r.nomUsage || r.adresse || "Copropriété"),
                    scoreGlobal: r.scoreGlobal,
                    latitude: r.latitude,
                    longitude: r.longitude,
                  }))}
                />
              </div>
            </Suspense>
          )}

          {/* Result cards */}
          {!loading && results.length > 0 && (
            <div className="flex flex-col gap-3">
              {results.map((r) => (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/copropriete/${r.slug ?? r.id}`)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/copropriete/${r.slug ?? r.id}`); } }}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-all hover:border-teal-200 hover:shadow-md sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {formatCoproName(r.nomUsage || r.adresse || "Adresse inconnue")}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {r.adresse} — {r.codePostal} {r.commune}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {r.nbLots != null && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Building2 className="h-3 w-3" />
                          {r.nbLots} lots
                        </span>
                      )}
                      {r.distance != null && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3 w-3" />
                          {r.distance}m
                        </span>
                      )}
                      {r.typeSyndic && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            SYNDIC_BADGES[r.typeSyndic] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {r.typeSyndic}
                        </span>
                      )}
                      {formatPeriod(r.periodeConstruction) && (
                        <span className="text-[11px] text-slate-400">
                          Construit {formatPeriod(r.periodeConstruction)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex items-center gap-2 sm:ml-4 sm:gap-3">
                    <FavoriteToggle
                      slug={r.slug ?? String(r.id)}
                      nom={formatCoproName(r.nomUsage || r.adresse || "Copropriété")}
                      adresse={r.adresse || ""}
                      commune={r.commune || ""}
                      score={r.scoreGlobal}
                      lots={r.nbLots}
                    />
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg sm:h-12 sm:w-12 ${scoreBg(r.scoreGlobal)}`}
                    >
                      <span
                        className={`text-lg font-bold sm:text-xl ${scoreColor(r.scoreGlobal)}`}
                      >
                        {r.scoreGlobal ?? "?"}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-teal-600" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePage(page - 1)}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <span className="text-sm text-slate-500">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePage(page + 1)}
                className="gap-1"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function RecherchePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      }
    >
      <RechercheContent />
    </Suspense>
  );
}
