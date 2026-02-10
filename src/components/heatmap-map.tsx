"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

interface HeatmapPoint {
  lat: number;
  lng: number;
  score: number;
}

// Convert score (0-100) to intensity (0-1): higher score = lower heat intensity
// We want low scores (bad) to be "hot" (red) and high scores to be "cool" (green)
// But leaflet.heat renders high values as hot, so we invert
function scoreToIntensity(score: number): number {
  return Math.max(0.1, (100 - score) / 100);
}

function HeatLayer({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();
  const heatLayerRef = useRef<L.HeatLayer | null>(null);

  useEffect(() => {
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    if (points.length === 0) return;

    const heatData: L.HeatLatLngTuple[] = points.map((p) => [
      p.lat,
      p.lng,
      scoreToIntensity(p.score),
    ]);

    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 20,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: "#059669",  // green (good scores)
        0.3: "#10b981",
        0.5: "#f59e0b",  // amber (medium)
        0.7: "#f97316",  // orange
        1.0: "#ef4444",  // red (bad scores)
      },
    }).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points]);

  return null;
}

function MapEvents({
  onBoundsChange,
  maxFreeZoom,
}: {
  onBoundsChange: (bounds: L.LatLngBounds) => void;
  maxFreeZoom: number;
}) {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds());
    },
    zoomend: () => {
      const zoom = map.getZoom();
      if (zoom > maxFreeZoom) {
        map.setZoom(maxFreeZoom);
      }
      onBoundsChange(map.getBounds());
    },
  });

  // Initial bounds
  useEffect(() => {
    onBoundsChange(map.getBounds());
  }, [map, onBoundsChange]);

  return null;
}

function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.5 });
  }, [map, lat, lng, zoom]);

  return null;
}

export interface HeatmapMapProps {
  onStatsChange?: (stats: { total: number; clustered: boolean }) => void;
  flyTo?: { lat: number; lng: number; zoom: number } | null;
}

export default function HeatmapMap({ onStatsChange, flyTo }: HeatmapMapProps) {
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const MAX_FREE_ZOOM = process.env.NEXT_PUBLIC_DEV_UNLOCK === "true" ? 18 : 13;

  const fetchHeatmap = useCallback(
    async (bounds: L.LatLngBounds) => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const s = bounds.getSouth();
      const w = bounds.getWest();
      const n = bounds.getNorth();
      const e = bounds.getEast();

      try {
        const res = await fetch(
          `/api/carte/heatmap?bounds=${s},${w},${n},${e}`,
          { signal: ctrl.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        setPoints(data.points ?? []);
        onStatsChange?.({ total: data.total ?? 0, clustered: data.clustered ?? false });
      } catch {
        // aborted or network error
      }
    },
    [onStatsChange]
  );

  return (
    <MapContainer
      center={[46.603, 2.888]}
      zoom={6}
      style={{ height: "100%", width: "100%" }}
      minZoom={5}
      maxZoom={MAX_FREE_ZOOM}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onBoundsChange={fetchHeatmap} maxFreeZoom={MAX_FREE_ZOOM} />
      <HeatLayer points={points} />
      {flyTo && <FlyTo lat={flyTo.lat} lng={flyTo.lng} zoom={flyTo.zoom} />}
    </MapContainer>
  );
}
