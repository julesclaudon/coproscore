"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import {
  Search,
  BarChart3,
  FileDown,
  Building2,
  Layers,
  ShieldCheck,
  MapPin,
  ArrowRight,
} from "lucide-react";

interface BanSuggestion {
  properties: {
    label: string;
    postcode: string;
    city: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface SearchResult {
  id: number;
  slug: string | null;
  adresse: string | null;
  commune: string | null;
  codePostal: string | null;
  nomUsage: string | null;
  scoreGlobal: number | null;
  nbLots: number | null;
  distance: number | null;
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

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [banSuggestions, setBanSuggestions] = useState<BanSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBan, setShowBan] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 3) {
      setBanSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
        );
        const data = await res.json();
        setBanSuggestions(data.features ?? []);
        setShowBan(true);
      } catch {
        setBanSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowBan(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function searchCoproprietes(
    address: string,
    coords?: { lon: number; lat: number }
  ) {
    setShowBan(false);
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: address });
      if (coords) {
        params.set("lat", coords.lat.toString());
        params.set("lon", coords.lon.toString());
      }
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleBanSelect(suggestion: BanSuggestion) {
    const label = suggestion.properties.label;
    const [lon, lat] = suggestion.geometry.coordinates;
    setQuery(label);
    setBanSuggestions([]);
    searchCoproprietes(label, { lon, lat });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length >= 3) {
      searchCoproprietes(query.trim());
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navigation */}
      <nav className="absolute top-0 z-10 w-full">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <span className="text-xl font-bold text-slate-900">
            Copro<span className="text-emerald-500">Score</span>
          </span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/80 via-white to-white pt-32 pb-20">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="absolute top-32 -left-24 h-64 w-64 rounded-full bg-emerald-50/60 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              La sant&eacute; de votre{" "}
              <span className="text-emerald-500">copropri&eacute;t&eacute;</span>
              <br />
              en un clic
            </h1>
            <p className="mb-10 text-lg text-slate-500">
              Score de confiance de 0 &agrave; 100 bas&eacute; sur les donn&eacute;es publiques
              du registre national, des transactions immobili&egrave;res et des diagnostics
              &eacute;nerg&eacute;tiques.
            </p>

            {/* Search bar */}
            <div ref={containerRef} className="relative mx-auto max-w-xl">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Entrez une adresse, une ville..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-14 rounded-xl border-slate-200 bg-white pl-12 text-base shadow-sm placeholder:text-slate-400 focus-visible:ring-emerald-500"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-14 rounded-xl bg-emerald-500 px-8 text-base font-semibold text-white shadow-sm hover:bg-emerald-600"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Recherche...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Rechercher
                    </span>
                  )}
                </Button>
              </form>

              {/* BAN autocomplete dropdown */}
              {showBan && banSuggestions.length > 0 && (
                <ul className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                  {banSuggestions.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:bg-emerald-50 first:rounded-t-xl last:rounded-b-xl"
                        onClick={() => handleBanSelect(s)}
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                        {s.properties.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {(results.length > 0 || (searched && !loading && results.length === 0)) && (
        <section className="border-t bg-white py-12">
          <div className="mx-auto max-w-2xl px-4">
            {results.length > 0 ? (
              <>
                <p className="mb-6 text-sm font-medium text-slate-500">
                  {results.length} copropri&eacute;t&eacute;
                  {results.length > 1 ? "s" : ""} trouv&eacute;e
                  {results.length > 1 ? "s" : ""}
                </p>
                <div className="flex flex-col gap-3">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => router.push(`/copropriete/${r.slug ?? r.id}`)}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-emerald-200 hover:shadow-md"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {r.nomUsage || r.adresse || "Adresse inconnue"}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-slate-500">
                          {r.adresse} &mdash; {r.codePostal} {r.commune}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                          {r.nbLots != null && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {r.nbLots} lots
                            </span>
                          )}
                          {r.distance != null && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {r.distance}m
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg ${scoreBg(r.scoreGlobal)}`}
                        >
                          <span
                            className={`text-xl font-bold ${scoreColor(r.scoreGlobal)}`}
                          >
                            {r.scoreGlobal ?? "?"}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-emerald-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">
                  Aucune copropri&eacute;t&eacute; trouv&eacute;e pour cette adresse.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Comment ca marche */}
      <section className="border-t bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">
            Comment &ccedil;a marche
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-slate-500">
            Obtenez un diagnostic complet de votre copropri&eacute;t&eacute; en
            quelques secondes, enti&egrave;rement bas&eacute; sur les donn&eacute;es publiques.
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            <Card className="relative border-0 bg-slate-50 shadow-none">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <Search className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="mb-3 inline-block rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
                  &Eacute;tape 1
                </span>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  Tapez une adresse
                </h3>
                <p className="text-sm text-slate-500">
                  Recherchez par adresse, ville ou code postal.
                  L&apos;autocompl&eacute;tion vous guide.
                </p>
              </CardContent>
            </Card>

            <Card className="relative border-0 bg-slate-50 shadow-none">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="mb-3 inline-block rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
                  &Eacute;tape 2
                </span>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  Consultez le score
                </h3>
                <p className="text-sm text-slate-500">
                  D&eacute;couvrez le score global et le d&eacute;tail par dimension :
                  technique, risques, gouvernance, &eacute;nergie, march&eacute;.
                </p>
              </CardContent>
            </Card>

            <Card className="relative border-0 bg-slate-50 shadow-none">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <FileDown className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="mb-3 inline-block rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-semibold text-white">
                  &Eacute;tape 3
                </span>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  T&eacute;l&eacute;chargez le rapport
                </h3>
                <p className="text-sm text-slate-500">
                  Obtenez un rapport complet et d&eacute;taill&eacute; &agrave; partager avec
                  votre syndic ou vos copropri&eacute;taires.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">619 402</p>
              <p className="mt-1 text-sm text-slate-500">
                copropri&eacute;t&eacute;s analys&eacute;es
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Layers className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">5</p>
              <p className="mt-1 text-sm text-slate-500">
                dimensions d&apos;&eacute;valuation
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">100%</p>
              <p className="mt-1 text-sm text-slate-500">
                donn&eacute;es publiques
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
