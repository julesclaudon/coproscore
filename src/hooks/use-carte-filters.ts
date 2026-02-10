"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface CarteFilters {
  scoreMin: number;
  scoreMax: number;
  syndic: string[];
  periode: string[];
}

export interface CarteBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface CartePoint {
  lat: number;
  lng: number;
  score: number;
  lots: number;
  slug: string;
  nom: string;
  commune: string | null;
  codePostal: string | null;
  typeSyndic: string | null;
  periodeConstruction: string | null;
  dpeClasse: string | null;
}

export interface CarteMetadata {
  total: number;
  returned: number;
  sampled: boolean;
}

const DEFAULT_FILTERS: CarteFilters = {
  scoreMin: 0,
  scoreMax: 100,
  syndic: [],
  periode: [],
};

export function useCarteFilters() {
  const [filters, setFilters] = useState<CarteFilters>(DEFAULT_FILTERS);
  const [bounds, setBounds] = useState<CarteBounds | null>(null);
  const [zoom, setZoom] = useState(6);
  const [points, setPoints] = useState<CartePoint[]>([]);
  const [metadata, setMetadata] = useState<CarteMetadata>({ total: 0, returned: 0, sampled: false });
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPoints = useCallback((b: CarteBounds, f: CarteFilters, z: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setLoading(true);

      const params = new URLSearchParams();
      params.set("bounds", `${b.south},${b.west},${b.north},${b.east}`);
      params.set("zoom", String(Math.round(z)));

      if (f.scoreMin > 0) params.set("scoreMin", String(f.scoreMin));
      if (f.scoreMax < 100) params.set("scoreMax", String(f.scoreMax));
      if (f.syndic.length > 0) params.set("syndic", f.syndic.join(","));
      if (f.periode.length > 0) params.set("periode", f.periode.join(","));

      try {
        const res = await fetch(`/api/carte/points?${params}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = await res.json();
        setPoints(data.points ?? []);
        setMetadata({ total: data.total, returned: data.returned, sampled: data.sampled });
      } catch {
        // aborted or network error
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 500);
  }, []);

  useEffect(() => {
    if (!bounds) return;
    fetchPoints(bounds, filters, zoom);
  }, [bounds, filters, zoom, fetchPoints]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleBoundsChange = useCallback((b: CarteBounds, z: number) => {
    setBounds(b);
    setZoom(z);
  }, []);

  return {
    filters,
    setFilters,
    handleBoundsChange,
    points,
    metadata,
    loading,
    resetFilters,
    zoom,
  };
}
