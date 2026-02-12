"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useCarteFilters } from "@/hooks/use-carte-filters";
import { CarteSidebar } from "@/components/carte-sidebar";
import { CarteBottomSheet } from "@/components/carte-bottom-sheet";
import { Header } from "@/components/header";
import {
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

const CarteMap = dynamic(() => import("@/components/carte-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="text-center">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-400">Chargement de la carte…</p>
      </div>
    </div>
  ),
});

export default function CartePage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isPro = role === "PRO" || role === "ADMIN";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const {
    filters,
    setFilters,
    handleBoundsChange,
    points,
    metadata,
    loading,
    resetFilters,
  } = useCarteFilters();

  const handleAddressSelect = useCallback(
    (v: { label: string; lon: number; lat: number }) => {
      setFlyTo({ lat: v.lat, lng: v.lon, zoom: 14 });
    },
    []
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <Header />

      {/* Main content: full-screen map + floating sidebar */}
      <div className="relative flex-1 overflow-hidden">
        {/* Map — 100% of screen */}
        <div className="absolute inset-0">
          <CarteMap
            points={points}
            onBoundsChange={handleBoundsChange}
            flyTo={flyTo}
            isPro={isPro}
          />
        </div>

        {/* Desktop floating sidebar */}
        <div
          className={`absolute left-4 top-4 bottom-4 z-20 hidden md:flex transition-all duration-300 ${
            sidebarOpen ? "w-80" : "w-0 overflow-hidden"
          }`}
        >
          <div className="flex h-full w-80 flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-md">
            <CarteSidebar
              filters={filters}
              onFiltersChange={setFilters}
              onResetFilters={resetFilters}
              onAddressSelect={handleAddressSelect}
              metadata={metadata}
              points={points}
              loading={loading}
              isPro={isPro}
            />
          </div>
        </div>

        {/* Sidebar toggle (desktop) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute top-1/2 z-30 hidden -translate-y-1/2 rounded-r-lg border border-l-0 border-slate-200 bg-white/90 px-1 py-3 text-slate-400 shadow-md backdrop-blur-sm transition-all hover:text-slate-600 md:block ${
            sidebarOpen ? "left-[calc(1rem+320px)]" : "left-0"
          }`}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </button>

        {/* Mobile bottom sheet */}
        <CarteBottomSheet>
          <CarteSidebar
            filters={filters}
            onFiltersChange={setFilters}
            onResetFilters={resetFilters}
            onAddressSelect={handleAddressSelect}
            metadata={metadata}
            points={points}
            loading={loading}
            isPro={isPro}
          />
        </CarteBottomSheet>
      </div>
    </div>
  );
}
