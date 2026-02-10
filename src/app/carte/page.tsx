"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { HistoryNavLink } from "@/components/history-nav-link";
import { FavoritesNavLink } from "@/components/favorites-nav-link";
import {
  Map,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Lock,
  Building2,
} from "lucide-react";
import type { HeatmapMapProps } from "@/components/heatmap-map";

const HeatmapMap = dynamic<HeatmapMapProps>(
  () => import("@/components/heatmap-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-100">
        <div className="text-center">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <p className="mt-2 text-sm text-slate-400">Chargement de la carte&hellip;</p>
        </div>
      </div>
    ),
  }
);

const LEGEND = [
  { color: "#ef4444", label: "< 40" },
  { color: "#f97316", label: "40-54" },
  { color: "#f59e0b", label: "55-69" },
  { color: "#10b981", label: "70-79" },
  { color: "#059669", label: "\u2265 80" },
];

export default function CartePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<{ total: number; clustered: boolean }>({
    total: 0,
    clustered: false,
  });
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const handleStatsChange = useCallback(
    (s: { total: number; clustered: boolean }) => setStats(s),
    []
  );

  function handleAddressSelect(v: { label: string; lon: number; lat: number }) {
    setFlyTo({ lat: v.lat, lng: v.lon, zoom: 13 });
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="z-30 shrink-0 border-b bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-4 px-4 py-2">
          <Link href="/" className="shrink-0 text-lg font-bold text-slate-900">
            Copro<span className="text-teal-600">Score</span>
          </Link>
          <nav className="ml-auto flex items-center gap-3 text-sm font-medium text-slate-600">
            <Link href="/" className="hidden transition-colors hover:text-teal-700 sm:block">
              Rechercher
            </Link>
            <span className="flex items-center gap-1 text-teal-700">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Carte</span>
            </span>
            <Link href="/comparateur" className="hidden transition-colors hover:text-teal-700 sm:block">
              Comparateur
            </Link>
            <Link href="/tarifs" className="hidden transition-colors hover:text-teal-700 sm:block">
              Tarifs
            </Link>
            <FavoritesNavLink />
            <HistoryNavLink />
          </nav>
        </div>
      </header>

      {/* Main content: sidebar + map */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`z-20 flex shrink-0 flex-col border-r bg-white transition-all duration-300 ${
            sidebarOpen ? "w-80" : "w-0"
          } overflow-hidden`}
        >
          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            {/* Search */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-500">
                Rechercher une adresse
              </p>
              <AddressAutocomplete
                onSelect={handleAddressSelect}
                placeholder="Adresse, ville..."
              />
            </div>

            {/* Legend */}
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">
                L&eacute;gende — Score moyen
              </p>
              <div className="flex flex-col gap-1">
                {LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-6 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-slate-600">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                Les zones rouges indiquent des quartiers avec des copropri&eacute;t&eacute;s
                en difficult&eacute;. Les zones vertes sont bien entretenues.
              </p>
            </div>

            {/* Stats */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">
                  {stats.total.toLocaleString("fr-FR")} copropri&eacute;t&eacute;
                  {stats.total > 1 ? "s" : ""}
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {stats.clustered
                  ? "Vue agr\u00e9g\u00e9e — zoomez pour plus de d\u00e9tails"
                  : "Points individuels visibles"}
              </p>
            </div>

            {/* Pro CTA */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-amber-800">
                <Lock className="h-3.5 w-3.5" />
                Zoom limit&eacute;
              </div>
              <p className="mt-1 text-xs text-amber-700">
                Zoomez plus avec l&apos;acc&egrave;s Pro pour explorer les quartiers en d&eacute;tail.
              </p>
              <Link
                href="/tarifs"
                className="mt-2 inline-block text-xs font-medium text-teal-700 underline underline-offset-2 hover:text-teal-900"
              >
                D&eacute;couvrir l&apos;offre Pro
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 z-30 -translate-y-1/2 rounded-r-md border border-l-0 border-slate-200 bg-white px-1 py-3 text-slate-400 shadow-sm transition-all hover:text-slate-600"
          style={{ left: sidebarOpen ? "320px" : "0px" }}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </button>

        {/* Map */}
        <div className="flex-1">
          <HeatmapMap
            onStatsChange={handleStatsChange}
            flyTo={flyTo}
          />
        </div>
      </div>
    </div>
  );
}
