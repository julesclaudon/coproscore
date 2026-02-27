"use client";

import { useMemo } from "react";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Building2,
  RotateCcw,
  Download,
  Loader2,
} from "lucide-react";
import type { CarteFilters, CarteMetadata, CartePoint } from "@/hooks/use-carte-filters";

const SYNDIC_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "professionnel", label: "Professionnel" },
  { value: "bénévole", label: "Bénévole" },
];

const PERIOD_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "AVANT_1949", label: "Avant 1949" },
  { value: "DE_1949_A_1960,DE_1961_A_1974", label: "1949-1975" },
  { value: "DE_1975_A_1993,DE_1994_A_2000", label: "1975-2000" },
  { value: "DE_2001_A_2010,A_COMPTER_DE_2011", label: "Après 2000" },
];

interface CarteSidebarProps {
  filters: CarteFilters;
  onFiltersChange: (filters: CarteFilters) => void;
  onResetFilters: () => void;
  onAddressSelect: (v: { label: string; lon: number; lat: number }) => void;
  metadata: CarteMetadata;
  points: CartePoint[];
  loading: boolean;
  isPro: boolean;
}

export function CarteSidebar({
  filters,
  onFiltersChange,
  onResetFilters,
  onAddressSelect,
  metadata,
  points,
  loading,
  isPro,
}: CarteSidebarProps) {
  const avgScore = useMemo(() => {
    if (points.length === 0) return null;
    const sum = points.reduce((acc, p) => acc + p.score, 0);
    return Math.round(sum / points.length);
  }, [points]);

  function selectSyndic(value: string) {
    if (value === "") {
      onFiltersChange({ ...filters, syndic: [] });
    } else {
      const isActive = filters.syndic.length === 1 && filters.syndic[0] === value;
      onFiltersChange({ ...filters, syndic: isActive ? [] : [value] });
    }
  }

  function selectPeriode(value: string) {
    if (value === "") {
      onFiltersChange({ ...filters, periode: [] });
    } else {
      const values = value.split(",");
      const isActive = filters.periode.length === values.length &&
        values.every((v) => filters.periode.includes(v));
      onFiltersChange({ ...filters, periode: isActive ? [] : values });
    }
  }

  function isSyndicActive(value: string) {
    if (value === "") return filters.syndic.length === 0;
    return filters.syndic.length === 1 && filters.syndic[0] === value;
  }

  function isPeriodeActive(value: string) {
    if (value === "") return filters.periode.length === 0;
    const values = value.split(",");
    return filters.periode.length === values.length &&
      values.every((v) => filters.periode.includes(v));
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (filters.scoreMin > 0) params.set("scoreMin", String(filters.scoreMin));
    if (filters.scoreMax < 100) params.set("scoreMax", String(filters.scoreMax));
    if (filters.syndic.length > 0) params.set("syndic", filters.syndic.join(","));
    if (filters.periode.length > 0) params.set("periode", filters.periode.join(","));

    window.open(`/api/carte/export?${params}`, "_blank");
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Search */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-500">
          Rechercher une adresse
        </p>
        <AddressAutocomplete
          onSelect={onAddressSelect}
          placeholder="Adresse, ville..."
        />
      </div>

      {/* Score slider with gradient track */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500">
          Score : {filters.scoreMin} – {filters.scoreMax}
        </p>
        <div
          className="relative"
          style={{
            background: `linear-gradient(to right, #ef4444, #f97316, #f59e0b, #10b981, #059669)`,
            borderRadius: "9999px",
            height: "6px",
            marginTop: "8px",
            marginBottom: "8px",
          }}
        >
          <Slider
            min={0}
            max={100}
            step={1}
            value={[filters.scoreMin, filters.scoreMax]}
            onValueChange={([min, max]) =>
              onFiltersChange({ ...filters, scoreMin: min, scoreMax: max })
            }
            className="absolute inset-0 [&_[data-slot=slider-track]]:bg-transparent [&_[data-slot=slider-range]]:bg-transparent"
          />
        </div>
      </div>

      {/* Syndic — toggle pills */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500">
          Type de syndic
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SYNDIC_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => selectSyndic(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isSyndicActive(opt.value)
                  ? "border-teal-500 bg-teal-500/10 text-teal-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Période — toggle pills */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500">
          Période de construction
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => selectPeriode(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isPeriodeActive(opt.value)
                  ? "border-teal-500 bg-teal-500/10 text-teal-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend — score gradient */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500">
          Légende
        </p>
        <div
          className="h-3 rounded-full"
          style={{
            background: "linear-gradient(to right, #ef4444, #f97316, #f59e0b, #10b981, #059669)",
          }}
        />
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>Attention</span>
          <span>Bon</span>
        </div>
      </div>

      {/* Stats viewport */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
          ) : (
            <Building2 className="h-4 w-4 text-slate-400" />
          )}
          <p className="text-sm font-medium text-slate-700">
            {metadata.total.toLocaleString("fr-FR")} copropriété
            {metadata.total > 1 ? "s" : ""}
          </p>
        </div>
        {avgScore !== null && (
          <p className="mt-1 text-xs text-slate-500">
            Score moyen : {avgScore}/100
          </p>
        )}
      </div>

      {/* Reset + Export */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetFilters}
          className="flex-1 justify-center gap-1.5 text-slate-500 hover:text-slate-700"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser
        </Button>

        <div className="relative flex-1">
          {!isPro && <FilterLock />}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!isPro}
            className={`w-full justify-center gap-1.5 ${!isPro ? "opacity-50 pointer-events-none" : ""}`}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterLock() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-amber-700 shadow-sm border border-amber-200">
        <Lock className="h-3 w-3" />
        Pro
      </span>
    </div>
  );
}
