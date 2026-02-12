"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Button } from "@/components/ui/button";
import { formatCoproName } from "@/lib/utils";
import { formatPeriod } from "@/lib/format";
import {
  Home,
  ChevronRight,
  X,
  Plus,
  Lock,
  Download,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/header";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CoproData {
  id: number;
  slug: string | null;
  nomUsage: string | null;
  adresseReference: string | null;
  communeAdresse: string | null;
  codePostal: string | null;
  nbTotalLots: number | null;
  nbLotsHabitation: number | null;
  periodeConstruction: string | null;
  typeSyndic: string | null;
  syndicatCooperatif: string | null;
  residenceService: string | null;
  coproDansPdp: number | null;
  scoreGlobal: number | null;
  scoreTechnique: number | null;
  scoreRisques: number | null;
  scoreGouvernance: number | null;
  scoreEnergie: number | null;
  scoreMarche: number | null;
  indiceConfiance: number | null;
  dpeClasseMediane: string | null;
  dpeNbLogements: number | null;
  marchePrixM2: number | null;
  marcheEvolution: number | null;
  marcheNbTransactions: number | null;
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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-400";
  if (score >= 70) return "text-teal-600";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

function scoreBg(score: number | null): string {
  if (score === null) return "bg-slate-100";
  if (score >= 70) return "bg-teal-50";
  if (score >= 40) return "bg-amber-50";
  return "bg-red-50";
}

function fmtPrix(n: number | null): string {
  if (n === null) return "\u2014";
  return Math.round(n).toLocaleString("fr-FR") + "\u00a0\u20ac";
}

function fmtEvo(n: number | null): string {
  if (n === null) return "\u2014";
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "\u00a0%";
}

const DPE_ORDER: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7 };

type HighlightDir = "high" | "low" | "dpe" | "none";

function getHighlights(
  copros: CoproData[],
  getValue: (c: CoproData) => number | null,
  direction: HighlightDir
): ("best" | "worst" | null)[] {
  if (copros.length < 2 || direction === "none") return copros.map(() => null);

  const vals = copros.map(getValue);
  const validVals = vals.filter((v) => v !== null) as number[];
  if (validVals.length < 2) return copros.map(() => null);

  const best = direction === "low" ? Math.min(...validVals) : Math.max(...validVals);
  const worst = direction === "low" ? Math.max(...validVals) : Math.min(...validVals);

  return vals.map((v) => {
    if (v === null) return null;
    if (v === best && best !== worst) return "best";
    if (v === worst && best !== worst) return "worst";
    return null;
  });
}

function getHighlightsDpe(copros: CoproData[]): ("best" | "worst" | null)[] {
  if (copros.length < 2) return copros.map(() => null);
  const vals = copros.map((c) => (c.dpeClasseMediane ? DPE_ORDER[c.dpeClasseMediane] ?? null : null));
  const valid = vals.filter((v) => v !== null) as number[];
  if (valid.length < 2) return copros.map(() => null);
  const best = Math.min(...valid);
  const worst = Math.max(...valid);
  return vals.map((v) => {
    if (v === null) return null;
    if (v === best && best !== worst) return "best";
    if (v === worst && best !== worst) return "worst";
    return null;
  });
}

function hlClass(hl: "best" | "worst" | null): string {
  if (hl === "best") return "bg-teal-50/70";
  if (hl === "worst") return "bg-red-50/50";
  return "";
}

// ─── Row definition ──────────────────────────────────────────────────────────

interface RowDef {
  label: string;
  group: string;
  getValue: (c: CoproData) => string;
  getNum?: (c: CoproData) => number | null;
  highlight: HighlightDir;
  isScore?: boolean;
}

const ROW_DEFS: RowDef[] = [
  // Identité
  { label: "Nom", group: "Identit\u00e9", getValue: (c) => formatCoproName(c.nomUsage || c.adresseReference || "\u2014"), highlight: "none" },
  { label: "Adresse", group: "Identit\u00e9", getValue: (c) => c.adresseReference || "\u2014", highlight: "none" },
  { label: "Commune", group: "Identit\u00e9", getValue: (c) => [c.codePostal, c.communeAdresse].filter(Boolean).join(" ") || "\u2014", highlight: "none" },
  { label: "Lots habitation", group: "Identit\u00e9", getValue: (c) => c.nbLotsHabitation != null ? String(c.nbLotsHabitation) : "\u2014", highlight: "none" },
  { label: "Lots total", group: "Identit\u00e9", getValue: (c) => c.nbTotalLots != null ? String(c.nbTotalLots) : "\u2014", highlight: "none" },
  { label: "Construction", group: "Identit\u00e9", getValue: (c) => formatPeriod(c.periodeConstruction) || "\u2014", highlight: "none" },
  // Scores
  { label: "Score global", group: "Scores", getValue: (c) => c.scoreGlobal != null ? `${c.scoreGlobal}/100` : "\u2014", getNum: (c) => c.scoreGlobal, highlight: "high", isScore: true },
  { label: "Technique", group: "Scores", getValue: (c) => c.scoreTechnique != null ? `${c.scoreTechnique}/25` : "\u2014", getNum: (c) => c.scoreTechnique, highlight: "high", isScore: true },
  { label: "Risques", group: "Scores", getValue: (c) => c.scoreRisques != null ? `${c.scoreRisques}/30` : "\u2014", getNum: (c) => c.scoreRisques, highlight: "high", isScore: true },
  { label: "Gouvernance", group: "Scores", getValue: (c) => c.scoreGouvernance != null ? `${c.scoreGouvernance}/25` : "\u2014", getNum: (c) => c.scoreGouvernance, highlight: "high", isScore: true },
  { label: "\u00c9nergie", group: "Scores", getValue: (c) => c.scoreEnergie != null ? `${c.scoreEnergie}/20` : "\u2014", getNum: (c) => c.scoreEnergie, highlight: "high", isScore: true },
  { label: "March\u00e9", group: "Scores", getValue: (c) => c.scoreMarche != null ? `${c.scoreMarche}/20` : "\u2014", getNum: (c) => c.scoreMarche, highlight: "high", isScore: true },
  { label: "Confiance", group: "Scores", getValue: (c) => c.indiceConfiance != null ? `${Math.round(c.indiceConfiance)}%` : "\u2014", getNum: (c) => c.indiceConfiance, highlight: "high", isScore: true },
  // Gouvernance
  { label: "Type syndic", group: "Gouvernance", getValue: (c) => c.typeSyndic || "\u2014", highlight: "none" },
  { label: "Coop\u00e9ratif", group: "Gouvernance", getValue: (c) => c.syndicatCooperatif === "oui" ? "Oui" : c.syndicatCooperatif === "non" ? "Non" : "\u2014", highlight: "none" },
  { label: "Plan de p\u00e9ril", group: "Gouvernance", getValue: (c) => c.coproDansPdp != null && c.coproDansPdp > 0 ? "Oui" : "Non", highlight: "none" },
  { label: "R\u00e9sidence service", group: "Gouvernance", getValue: (c) => c.residenceService === "oui" ? "Oui" : c.residenceService === "non" ? "Non" : "\u2014", highlight: "none" },
  // Énergie
  { label: "Classe DPE", group: "\u00c9nergie", getValue: (c) => c.dpeClasseMediane || "\u2014", highlight: "dpe" },
  // Marché
  { label: "Prix moyen/m\u00b2", group: "March\u00e9", getValue: (c) => c.marchePrixM2 != null ? `${fmtPrix(c.marchePrixM2)}/m\u00b2` : "\u2014", getNum: (c) => c.marchePrixM2, highlight: "none" },
  { label: "\u00c9volution annuelle", group: "March\u00e9", getValue: (c) => fmtEvo(c.marcheEvolution), getNum: (c) => c.marcheEvolution, highlight: "high" },
  { label: "Transactions secteur", group: "March\u00e9", getValue: (c) => c.marcheNbTransactions != null ? String(c.marcheNbTransactions) : "\u2014", getNum: (c) => c.marcheNbTransactions, highlight: "high" },
];

// ─── Export helpers ──────────────────────────────────────────────────────────

function getExportUrl(copros: CoproData[], format: "csv" | "pdf"): string {
  const ids = copros.map((c) => c.slug).filter(Boolean).join(",");
  return `/api/comparateur/export?ids=${ids}&format=${format}`;
}

// ─── Search dropdown for copro selection ─────────────────────────────────────

function CoproSearch({
  onAdd,
  existingSlugs,
}: {
  onAdd: (slug: string) => void;
  existingSlugs: Set<string>;
}) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchKey, setSearchKey] = useState(0);

  async function handleSelect(v: { label: string; lon: number; lat: number }) {
    try {
      const res = await fetch(
        `/api/search?lat=${v.lat}&lon=${v.lon}&limit=5`
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setShowResults(true);
    } catch {
      setResults([]);
    }
  }

  async function handleSubmit(query: string) {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setResults(data.results ?? []);
      setShowResults(true);
    } catch {
      setResults([]);
    }
  }

  function selectCopro(slug: string) {
    onAdd(slug);
    setShowResults(false);
    setResults([]);
    setSearchKey((k) => k + 1);
  }

  return (
    <div className="relative">
      <AddressAutocomplete
        key={searchKey}
        onSelect={handleSelect}
        onSubmit={handleSubmit}
        placeholder="Rechercher une copropri\u00e9t\u00e9 \u00e0 ajouter..."
      />
      {showResults && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
          <p className="px-4 py-2 text-xs text-slate-400">
            S\u00e9lectionnez une copropri\u00e9t\u00e9
          </p>
          {results.map((r) => {
            const disabled = !r.slug || existingSlugs.has(r.slug);
            return (
              <button
                key={r.id}
                type="button"
                disabled={disabled}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors last:rounded-b-xl ${
                  disabled
                    ? "cursor-not-allowed text-slate-300"
                    : "text-slate-700 hover:bg-teal-50"
                }`}
                onClick={() => r.slug && selectCopro(r.slug)}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${scoreBg(r.scoreGlobal)} ${scoreColor(r.scoreGlobal)}`}
                >
                  {r.scoreGlobal ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {formatCoproName(r.nomUsage || r.adresse || "Copropri\u00e9t\u00e9")}
                  </p>
                  <p className="text-xs text-slate-400">
                    {r.codePostal} {r.commune}
                    {r.nbLots != null && ` \u2022 ${r.nbLots} lots`}
                  </p>
                </div>
                {disabled && r.slug && existingSlugs.has(r.slug) && (
                  <span className="text-xs text-slate-400">D\u00e9j\u00e0 ajout\u00e9</span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            className="w-full rounded-b-xl border-t px-4 py-2 text-center text-xs text-slate-400 transition-colors hover:bg-slate-50"
            onClick={() => setShowResults(false)}
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page component ─────────────────────────────────────────────────────

export default function ComparateurPageWrapper() {
  return (
    <Suspense>
      <ComparateurPage />
    </Suspense>
  );
}

function ComparateurPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copros, setCopros] = useState<CoproData[]>([]);
  const [loading, setLoading] = useState(false);

  const slugsFromUrl = useMemo(() => {
    const ids = searchParams.get("ids");
    if (!ids) return [];
    return ids.split(",").filter(Boolean).slice(0, 5);
  }, [searchParams]);

  const existingSlugs = useMemo(
    () => new Set(copros.map((c) => c.slug).filter(Boolean) as string[]),
    [copros]
  );

  // Fetch copros from URL slugs
  const fetchCopros = useCallback(async (slugs: string[]) => {
    if (slugs.length === 0) {
      setCopros([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/comparateur?slugs=${slugs.join(",")}`);
      const data = await res.json();
      setCopros(data.copros ?? []);
    } catch {
      setCopros([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (slugsFromUrl.length > 0) {
      fetchCopros(slugsFromUrl);
    }
  }, [slugsFromUrl, fetchCopros]);

  function updateUrl(slugs: string[]) {
    const params = new URLSearchParams();
    if (slugs.length > 0) params.set("ids", slugs.join(","));
    router.replace(`/comparateur${slugs.length > 0 ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  function addCopro(slug: string) {
    const current = copros.map((c) => c.slug!).filter(Boolean);
    if (current.includes(slug) || current.length >= 5) return;
    const next = [...current, slug];
    updateUrl(next);
    fetchCopros(next);
  }

  function removeCopro(slug: string) {
    const next = copros.filter((c) => c.slug !== slug).map((c) => c.slug!).filter(Boolean);
    updateUrl(next);
    if (next.length > 0) {
      fetchCopros(next);
    } else {
      setCopros([]);
    }
  }

  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isPro = role === "PRO" || role === "ADMIN";
  const isFree = !isPro;
  const maxCopros = isPro ? 5 : 2;
  const canAdd = copros.length < maxCopros;

  // Group rows
  const groups = useMemo(() => {
    const map = new Map<string, RowDef[]>();
    for (const row of ROW_DEFS) {
      if (!map.has(row.group)) map.set(row.group, []);
      map.get(row.group)!.push(row);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* Header */}
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
            <Link href="/" className="flex items-center gap-1 transition-colors hover:text-teal-700">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Accueil</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-600">Comparateur</span>
          </nav>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Comparer des copropri&eacute;t&eacute;s
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            S&eacute;lectionnez {isFree ? "2" : "2 \u00e0 5"} copropri&eacute;t&eacute;s pour les comparer c&ocirc;te &agrave; c&ocirc;te.
          </p>

          {/* Selected copros chips + search */}
          <div className="mt-6 space-y-3">
            {/* Chips */}
            <div className="flex flex-wrap gap-2">
              {copros.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-3 pr-1.5 text-sm"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${scoreBg(c.scoreGlobal)} ${scoreColor(c.scoreGlobal)}`}
                  >
                    {c.scoreGlobal ?? "?"}
                  </span>
                  <Link
                    href={`/copropriete/${c.slug}`}
                    className="max-w-[200px] truncate font-medium text-slate-700 hover:text-teal-700"
                  >
                    {formatCoproName(c.nomUsage || c.adresseReference || "Copro")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeCopro(c.slug!)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {copros.length === 0 && !loading && (
                <p className="text-sm text-slate-400">
                  Aucune copropri&eacute;t&eacute; s&eacute;lectionn&eacute;e
                </p>
              )}
            </div>

            {/* Search to add */}
            {canAdd && (
              <div className="max-w-lg">
                <CoproSearch onAdd={addCopro} existingSlugs={existingSlugs} />
              </div>
            )}

            {/* Pro upsell for more than 2 */}
            {isFree && copros.length >= 2 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                <Lock className="h-4 w-4 shrink-0" />
                <span>
                  Passez Pro pour comparer jusqu&apos;&agrave; 5 copropri&eacute;t&eacute;s &mdash;{" "}
                  <Link href="/tarifs" className="font-semibold underline hover:text-amber-900">
                    29&euro;/mois
                  </Link>
                </span>
              </div>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {/* Skeleton header */}
              <div className="flex border-b border-slate-100 px-4 py-3">
                <div className="w-32 shrink-0" />
                {Array.from({ length: slugsFromUrl.length || 2 }).map((_, i) => (
                  <div key={i} className="flex-1 px-3">
                    <div className="mx-auto h-4 w-24 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
              {/* Skeleton rows */}
              {Array.from({ length: 8 }).map((_, ri) => (
                <div key={ri} className={`flex px-4 py-3 ${ri > 0 ? "border-t border-slate-50" : ""}`}>
                  <div className="w-32 shrink-0">
                    <div className="h-3.5 w-20 animate-pulse rounded bg-slate-100" />
                  </div>
                  {Array.from({ length: slugsFromUrl.length || 2 }).map((_, ci) => (
                    <div key={ci} className="flex-1 px-3">
                      <div className="mx-auto h-3.5 w-16 animate-pulse rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Comparison table */}
          {!loading && copros.length >= 2 && (
            <>
              {/* Export buttons */}
              <div className="mt-6 flex gap-2">
                {isFree ? (
                  <>
                    <Button variant="outline" size="sm" disabled className="gap-1.5 text-slate-400">
                      <Lock className="h-3.5 w-3.5" />
                      Exporter PDF
                    </Button>
                    <Button variant="outline" size="sm" disabled className="gap-1.5 text-slate-400">
                      <Lock className="h-3.5 w-3.5" />
                      Exporter CSV
                    </Button>
                  </>
                ) : (
                  <>
                    <a href={getExportUrl(copros, "pdf")}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        Exporter PDF
                      </Button>
                    </a>
                    <a href={getExportUrl(copros, "csv")}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        Exporter CSV
                      </Button>
                    </a>
                  </>
                )}
              </div>

              {/* Table */}
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[600px] text-sm">
                  {/* Header: copro names */}
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-xs font-medium text-slate-400">
                        Crit&egrave;re
                      </th>
                      {copros.map((c) => (
                        <th key={c.id} className="px-3 py-3 text-center">
                          <Link
                            href={`/copropriete/${c.slug}`}
                            className="text-sm font-semibold text-slate-900 hover:text-teal-700"
                          >
                            {formatCoproName(c.nomUsage || c.adresseReference || "Copro")}
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map(([groupName, rows], gi) => {
                      const isScoreGroup = groupName === "Scores";
                      const isBlurred = isFree && !isScoreGroup && groupName !== "Identit\u00e9";

                      return (
                        <GroupRows
                          key={groupName}
                          groupName={groupName}
                          rows={rows}
                          copros={copros}
                          isBlurred={isBlurred}
                          isLast={gi === groups.length - 1}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Disclaimer */}
              <p className="mt-3 text-[11px] text-slate-400">
                Donn&eacute;es issues du RNIC, DVF, DPE ADEME. Les meilleurs scores sont surlign&eacute;s en vert, les moins bons en rouge.
              </p>
            </>
          )}

          {/* Empty state */}
          {!loading && copros.length < 2 && copros.length > 0 && (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <Plus className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">
                Ajoutez au moins une autre copropri&eacute;t&eacute; pour lancer la comparaison.
              </p>
            </div>
          )}

          {!loading && copros.length === 0 && (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <Plus className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="font-medium text-slate-600">
                Commencez par rechercher une copropri&eacute;t&eacute;
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Utilisez la barre de recherche ci-dessus pour ajouter des copropri&eacute;t&eacute;s au comparateur.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ─── Table group rows ────────────────────────────────────────────────────────

function GroupRows({
  groupName,
  rows,
  copros,
  isBlurred,
  isLast,
}: {
  groupName: string;
  rows: RowDef[];
  copros: CoproData[];
  isBlurred: boolean;
  isLast: boolean;
}) {
  return (
    <>
      {/* Group header */}
      <tr className="border-t border-slate-100 bg-slate-50/80">
        <td
          colSpan={copros.length + 1}
          className="sticky left-0 z-10 bg-slate-50/80 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase"
        >
          {groupName}
        </td>
      </tr>

      {/* Rows — potentially blurred */}
      {isBlurred ? (
        <tr>
          <td colSpan={copros.length + 1} className="relative px-0 py-0">
            <div className="select-none blur-sm">
              <table className="w-full text-sm">
                <tbody>
                  {rows.map((row) => (
                    <DataRow key={row.label} row={row} copros={copros} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <Link
                href="/tarifs"
                className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-teal-700 shadow-sm transition-colors hover:text-teal-900"
              >
                <Lock className="h-3.5 w-3.5" />
                Passez Pro &mdash; 29&euro;/mois
              </Link>
            </div>
          </td>
        </tr>
      ) : (
        rows.map((row) => <DataRow key={row.label} row={row} copros={copros} />)
      )}
    </>
  );
}

const DIMENSION_MAX: Record<string, number> = {
  Technique: 25,
  Risques: 30,
  Gouvernance: 25,
  "\u00c9nergie": 20,
  "March\u00e9": 20,
};

function dimensionScoreColor(label: string, score: number | null): string {
  if (score == null) return "text-slate-400";
  const max = DIMENSION_MAX[label];
  if (!max) return scoreColor(score);
  const pct = score / max;
  if (pct >= 0.7) return "text-teal-600";
  if (pct >= 0.4) return "text-amber-500";
  return "text-red-500";
}

function DataRow({ row, copros }: { row: RowDef; copros: CoproData[] }) {
  const highlights =
    row.highlight === "dpe"
      ? getHighlightsDpe(copros)
      : row.getNum
        ? getHighlights(copros, row.getNum, row.highlight)
        : copros.map(() => null);

  return (
    <tr className="border-t border-slate-50">
      <td className="sticky left-0 z-10 bg-white px-4 py-2.5 text-slate-500 whitespace-nowrap">
        {row.label}
      </td>
      {copros.map((c, i) => {
        const val = row.getValue(c);
        const isScoreGlobal = row.label === "Score global";
        const cellColor = row.isScore
          ? dimensionScoreColor(row.label, row.getNum ? row.getNum(c) : null)
          : "";
        return (
          <td
            key={c.id}
            className={`px-3 py-2.5 text-center font-medium tabular-nums text-slate-900 ${hlClass(highlights[i])}`}
          >
            {isScoreGlobal && c.scoreGlobal != null ? (
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${scoreBg(c.scoreGlobal)} ${scoreColor(c.scoreGlobal)}`}>
                {c.scoreGlobal}
              </span>
            ) : (
              <span className={cellColor}>
                {val}
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
