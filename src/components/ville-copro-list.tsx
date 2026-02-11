"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { scoreColor, scoreBg, formatPeriod } from "@/lib/format";
import { formatCoproName } from "@/lib/utils";
import { Building2, ArrowRight, Search, Crown, Download, Lock } from "lucide-react";
import { FavoriteToggle } from "@/components/favorite-toggle";

export interface VilleCoproItem {
  id: number;
  slug: string | null;
  adresseReference: string | null;
  nomUsage: string | null;
  codePostal: string | null;
  scoreGlobal: number | null;
  nbLotsHabitation: number | null;
  typeSyndic: string | null;
  periodeConstruction: string | null;
}

type SortKey = "score-desc" | "score-asc" | "lots" | "adresse";

const PAGE_SIZE = 20;

export function VilleCoproList({
  copros,
  totalCount,
  villeSlug,
  cp,
}: {
  copros: VilleCoproItem[];
  totalCount: number;
  villeSlug?: string;
  cp?: string;
}) {
  const [query, setQuery] = useState("");
  const [syndic, setSyndic] = useState("");
  const [periode, setPeriode] = useState("");
  const [scoreBucket, setScoreBucket] = useState("");
  const [sort, setSort] = useState<SortKey>("score-desc");
  const [page, setPage] = useState(1);

  // Extract unique values for selects
  const syndicOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of copros) {
      if (c.typeSyndic) set.add(c.typeSyndic);
    }
    return Array.from(set).sort();
  }, [copros]);

  const periodeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of copros) {
      if (c.periodeConstruction && formatPeriod(c.periodeConstruction)) {
        set.add(c.periodeConstruction);
      }
    }
    return Array.from(set).sort();
  }, [copros]);

  const filtered = useMemo(() => {
    let result = copros;

    // Text search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (c) =>
          (c.adresseReference && c.adresseReference.toLowerCase().includes(q)) ||
          (c.nomUsage && c.nomUsage.toLowerCase().includes(q))
      );
    }

    // Syndic filter
    if (syndic) {
      result = result.filter((c) => c.typeSyndic === syndic);
    }

    // Période filter
    if (periode) {
      result = result.filter((c) => c.periodeConstruction === periode);
    }

    // Score bucket filter
    if (scoreBucket === "<40") {
      result = result.filter((c) => c.scoreGlobal !== null && c.scoreGlobal < 40);
    } else if (scoreBucket === "40-69") {
      result = result.filter(
        (c) => c.scoreGlobal !== null && c.scoreGlobal >= 40 && c.scoreGlobal < 70
      );
    } else if (scoreBucket === ">=70") {
      result = result.filter((c) => c.scoreGlobal !== null && c.scoreGlobal >= 70);
    }

    // Sort
    const sorted = [...result];
    switch (sort) {
      case "score-desc":
        sorted.sort((a, b) => (b.scoreGlobal ?? -1) - (a.scoreGlobal ?? -1));
        break;
      case "score-asc":
        sorted.sort((a, b) => (a.scoreGlobal ?? 999) - (b.scoreGlobal ?? 999));
        break;
      case "lots":
        sorted.sort(
          (a, b) => (b.nbLotsHabitation ?? 0) - (a.nbLotsHabitation ?? 0)
        );
        break;
      case "adresse":
        sorted.sort((a, b) =>
          (a.adresseReference ?? "").localeCompare(b.adresseReference ?? "", "fr")
        );
        break;
    }

    return sorted;
  }, [copros, query, syndic, periode, scoreBucket, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function resetPage() {
    setPage(1);
  }

  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isPro = role === "PRO" || role === "ADMIN";

  return (
    <div>
      {/* Pro CTA banner */}
      {!isPro && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-2.5">
          <Crown className="h-4 w-4 shrink-0 text-teal-600" />
          <p className="min-w-0 flex-1 text-xs text-slate-600 sm:text-sm">
            D&eacute;bloquez les filtres avanc&eacute;s et l&apos;export CSV avec
            l&apos;acc&egrave;s Pro &mdash; 29&nbsp;&euro;/mois
          </p>
          {villeSlug ? (
            <a
              href={`/api/ville/${villeSlug}/export?format=csv${cp ? `&cp=${cp}` : ""}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400 opacity-60 pointer-events-none"
              title="R&eacute;serv&eacute; aux abonn&eacute;s Pro"
            >
              <Lock className="h-3 w-3" />
              Exporter CSV
            </a>
          ) : (
            <Link href="/tarifs">
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-teal-300 text-xs text-teal-700 hover:bg-teal-100"
              >
                En savoir plus
              </Button>
            </Link>
          )}
        </div>
      )}
      {isPro && villeSlug && (
        <div className="mb-4 flex justify-end">
          <a
            href={`/api/ville/${villeSlug}/export?format=csv${cp ? `&cp=${cp}` : ""}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3 w-3" />
            Exporter CSV
          </a>
        </div>
      )}

      {/* Search + filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Rechercher une adresse\u2026"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
            className="pl-8"
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
        <select
          value={syndic}
          onChange={(e) => {
            setSyndic(e.target.value);
            resetPage();
          }}
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
        >
          <option value="">Syndic : tous</option>
          {syndicOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={periode}
          onChange={(e) => {
            setPeriode(e.target.value);
            resetPage();
          }}
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
        >
          <option value="">P&eacute;riode : toutes</option>
          {periodeOptions.map((p) => (
            <option key={p} value={p}>
              {formatPeriod(p)}
            </option>
          ))}
        </select>
        <select
          value={scoreBucket}
          onChange={(e) => {
            setScoreBucket(e.target.value);
            resetPage();
          }}
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
        >
          <option value="">Score : tous</option>
          <option value=">=70">Bon (&ge; 70)</option>
          <option value="40-69">Moyen (40-69)</option>
          <option value="<40">Attention (&lt; 40)</option>
        </select>
        </div>
      </div>

      {/* Sort pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["score-desc", "Score \u2193"],
            ["score-asc", "Score \u2191"],
            ["lots", "Lots"],
            ["adresse", "Adresse A-Z"],
          ] as [SortKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setSort(key);
              resetPage();
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sort === key
                ? "bg-teal-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-slate-400">
          {filtered.length.toLocaleString("fr-FR")} r&eacute;sultat
          {filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      <div className="divide-y">
        {paginated.map((c) => (
          <Link
            key={c.id}
            href={`/copropriete/${c.slug ?? c.id}`}
            className="group flex items-center gap-4 py-3 transition-colors hover:bg-slate-50"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${scoreBg(c.scoreGlobal)} ${scoreColor(c.scoreGlobal)}`}
            >
              {c.scoreGlobal ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {formatCoproName(
                  c.nomUsage || c.adresseReference || "Copropri\u00e9t\u00e9"
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 sm:gap-3">
                {c.codePostal && <span>{c.codePostal}</span>}
                {c.nbLotsHabitation != null && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {c.nbLotsHabitation} lots
                  </span>
                )}
                {c.typeSyndic && <span className="hidden sm:inline">{c.typeSyndic}</span>}
              </div>
            </div>
            <FavoriteToggle
              slug={c.slug ?? String(c.id)}
              nom={formatCoproName(c.nomUsage || c.adresseReference || "Copropri\u00e9t\u00e9")}
              adresse={c.adresseReference || ""}
              commune={c.codePostal || ""}
              score={c.scoreGlobal}
              lots={c.nbLotsHabitation}
            />
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" />
          </Link>
        ))}
        {paginated.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            Aucune copropri&eacute;t&eacute; trouv&eacute;e avec ces crit&egrave;res.
          </p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Pr&eacute;c&eacute;dent
          </Button>
          <span className="text-sm text-slate-500">
            Page {safePage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Pro upsell at bottom of list */}
      {totalCount > filtered.length && (
        <p className="mt-4 text-center text-xs text-slate-400">
          Connectez-vous avec un compte Pro pour voir les{" "}
          {totalCount.toLocaleString("fr-FR")} r&eacute;sultats
        </p>
      )}
    </div>
  );
}
