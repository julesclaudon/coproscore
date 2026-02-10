"use client";

import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import MapGL, {
  NavigationControl,
  Source,
  Layer,
  type MapRef,
  type ViewStateChangeEvent,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CartePoint, CarteBounds } from "@/hooks/use-carte-filters";
import Link from "next/link";
import { X, Star } from "lucide-react";

const VOYAGER_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

/* ── Color helpers ─────────────────────────────────────────────── */

function scoreToHex(score: number): string {
  if (score >= 80) return "#059669";
  if (score >= 70) return "#10b981";
  if (score >= 55) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function formatSyndic(type: string | null): string {
  if (!type) return "";
  switch (type) {
    case "professionnel": return "Professionnel";
    case "bénévole": return "Bénévole";
    default: return type;
  }
}

/* ── MapLibre expression: score → color (red→green) ───────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCORE_COLOR: any = [
  "interpolate", ["linear"],
  ["get", "score"],
  0, "#ef4444",
  40, "#f97316",
  55, "#f59e0b",
  70, "#10b981",
  80, "#059669",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AVG_SCORE_COLOR: any = [
  "interpolate", ["linear"],
  ["/", ["get", "scoreSum"], ["get", "point_count"]],
  0, "#ef4444",
  40, "#f97316",
  55, "#f59e0b",
  70, "#10b981",
  80, "#059669",
];

/* ── Types ─────────────────────────────────────────────────────── */

interface CarteMapProps {
  points: CartePoint[];
  onBoundsChange: (bounds: CarteBounds, zoom: number) => void;
  flyTo?: { lat: number; lng: number; zoom: number } | null;
  isPro: boolean;
}

type HoverInfo =
  | { type: "cluster"; x: number; y: number; count: number; avgScore: number }
  | { type: "point"; x: number; y: number; nom: string; score: number; lots: number; commune: string | null };

/* ── Component ─────────────────────────────────────────────────── */

export default function CarteMap({ points, onBoundsChange, flyTo, isPro }: CarteMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    latitude: 46.6,
    longitude: 2.3,
    zoom: 6,
    pitch: 0,
    bearing: 0,
  });
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [clicked, setClicked] = useState<{ point: CartePoint } | null>(null);

  /* Convert flat points → GeoJSON for MapLibre clustering */
  const geojson = useMemo((): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [p.lng, p.lat],
      },
      properties: {
        score: p.score,
        lots: p.lots || 0,
        slug: p.slug,
        nom: p.nom,
        commune: p.commune,
        codePostal: p.codePostal,
        typeSyndic: p.typeSyndic,
        periodeConstruction: p.periodeConstruction,
        dpeClasse: p.dpeClasse,
      },
    })),
  }), [points]);

  /* ── Interactions ──────────────────────────────────────────── */

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) {
      setHoverInfo(null);
      return;
    }

    if (feature.properties?.cluster) {
      const count = feature.properties.point_count ?? 0;
      const scoreSum = feature.properties.scoreSum ?? 0;
      const avgScore = count > 0 ? Math.round(scoreSum / count) : 0;
      setHoverInfo({ type: "cluster", x: e.point.x, y: e.point.y, count, avgScore });
    } else {
      setHoverInfo({
        type: "point",
        x: e.point.x,
        y: e.point.y,
        nom: feature.properties?.nom ?? "Copropriété",
        score: feature.properties?.score ?? 0,
        lots: feature.properties?.lots ?? 0,
        commune: feature.properties?.commune || null,
      });
    }
  }, []);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) {
      setClicked(null);
      return;
    }

    if (feature.properties?.cluster) {
      // Zoom in towards the cluster
      const coords = (feature.geometry as GeoJSON.Point).coordinates;
      mapRef.current?.flyTo({
        center: [coords[0], coords[1]],
        zoom: Math.min(viewState.zoom + 3, 17),
        duration: 600,
      });
      setClicked(null);
    } else {
      // Individual point → show popup
      const coords = (feature.geometry as GeoJSON.Point).coordinates;
      const p = feature.properties;
      setClicked({
        point: {
          lat: coords[1],
          lng: coords[0],
          score: p?.score ?? 0,
          lots: p?.lots ?? 0,
          slug: p?.slug ?? "",
          nom: p?.nom ?? "Copropriété",
          commune: p?.commune || null,
          codePostal: p?.codePostal || null,
          typeSyndic: p?.typeSyndic || null,
          periodeConstruction: p?.periodeConstruction || null,
          dpeClasse: p?.dpeClasse || null,
        },
      });
      setHoverInfo(null);
    }
  }, [viewState.zoom]);

  const handleMoveEnd = useCallback(
    (e: ViewStateChangeEvent) => {
      const map = e.target;
      const b = map.getBounds();
      onBoundsChange(
        {
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast(),
        },
        map.getZoom()
      );
    },
    [onBoundsChange]
  );

  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo({
        center: [flyTo.lng, flyTo.lat],
        zoom: flyTo.zoom,
        duration: 1500,
      });
    }
  }, [flyTo]);

  const cursor = hoverInfo ? "pointer" : "grab";

  return (
    <div className="relative h-full w-full">
      <MapGL
        ref={mapRef}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        onMoveEnd={handleMoveEnd}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverInfo(null)}
        interactiveLayerIds={["clusters", "unclustered-point"]}
        cursor={cursor}
        style={{ width: "100%", height: "100%" }}
        mapStyle={VOYAGER_STYLE}
        doubleClickZoom={true}
      >
        <NavigationControl position="top-right" />

        <Source
          id="copros"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={60}
          clusterProperties={{ scoreSum: ["+", ["get", "score"]] }}
        >
          {/* 1. Cluster circles — color = avg score, size = count */}
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": AVG_SCORE_COLOR,
              "circle-radius": [
                "step", ["get", "point_count"],
                18,          // default < 10
                10, 22,      // 10–49
                50, 26,      // 50–199
                200, 32,     // 200–999
                1000, 38,    // 1000+
              ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
              "circle-opacity": 0.88,
              "circle-stroke-width": 2.5,
              "circle-stroke-color": "#ffffff",
            }}
          />

          {/* 2. Cluster count label */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": ["get", "point_count_abbreviated"] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
              "text-size": 12,
              "text-font": ["Open Sans Semibold"],
              "text-allow-overlap": true,
            }}
            paint={{
              "text-color": "#ffffff",
            }}
          />

          {/* 3. Individual point circles */}
          <Layer
            id="unclustered-point"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": SCORE_COLOR,
              "circle-radius": [
                "interpolate", ["linear"], ["zoom"],
                10, 5,
                14, 8,
                17, 12,
              ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
              "circle-opacity": 0.85,
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#ffffff",
            }}
          />

          {/* 4. Score label on individual points (high zoom) */}
          <Layer
            id="point-score"
            type="symbol"
            filter={["!", ["has", "point_count"]]}
            minzoom={15}
            layout={{
              "text-field": ["to-string", ["get", "score"]] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
              "text-size": 10,
              "text-font": ["Open Sans Semibold"],
              "text-allow-overlap": true,
            }}
            paint={{
              "text-color": "#ffffff",
            }}
          />
        </Source>
      </MapGL>

      {/* ── Hover tooltip: cluster ──────────────────────────────── */}
      {hoverInfo?.type === "cluster" && (
        <div
          className="pointer-events-none absolute z-50 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm"
          style={{
            left: hoverInfo.x + 14,
            top: hoverInfo.y - 14,
            transform: "translateY(-100%)",
          }}
        >
          <p className="text-sm font-semibold text-slate-800">
            {hoverInfo.count.toLocaleString("fr-FR")} copropriété{hoverInfo.count > 1 ? "s" : ""}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Score moyen :{" "}
            <span className="font-semibold" style={{ color: scoreToHex(hoverInfo.avgScore) }}>
              {hoverInfo.avgScore}
            </span>
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Cliquez pour zoomer
          </p>
        </div>
      )}

      {/* ── Hover tooltip: individual point ─────────────────────── */}
      {hoverInfo?.type === "point" && (
        <div
          className="pointer-events-none absolute z-50 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm"
          style={{
            left: hoverInfo.x + 14,
            top: hoverInfo.y - 14,
            transform: "translateY(-100%)",
          }}
        >
          <p className="text-sm font-medium text-slate-800 leading-tight">
            {hoverInfo.nom}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
              style={{ backgroundColor: scoreToHex(hoverInfo.score) }}
            >
              {hoverInfo.score}
            </span>
            {hoverInfo.lots > 0 && <span>{hoverInfo.lots} lots</span>}
            {hoverInfo.commune && <span>{hoverInfo.commune}</span>}
          </div>
        </div>
      )}

      {/* ── Click popup card ────────────────────────────────────── */}
      {clicked && (
        <div className="absolute bottom-6 left-1/2 z-50 w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-slate-200 bg-white shadow-2xl">
          <button
            onClick={() => setClicked(null)}
            className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-4">
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: scoreToHex(clicked.point.score) }}
              >
                {clicked.point.score}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-tight">
                  {clicked.point.nom}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Score {clicked.point.score}/100
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
              {clicked.point.commune && (
                <div>
                  <span className="text-slate-400">Commune</span>
                  <p className="font-medium">
                    {clicked.point.commune}
                    {clicked.point.codePostal && ` (${clicked.point.codePostal})`}
                  </p>
                </div>
              )}
              {clicked.point.lots > 0 && (
                <div>
                  <span className="text-slate-400">Lots</span>
                  <p className="font-medium">{clicked.point.lots}</p>
                </div>
              )}
              {clicked.point.typeSyndic && (
                <div>
                  <span className="text-slate-400">Syndic</span>
                  <p className="font-medium">{formatSyndic(clicked.point.typeSyndic)}</p>
                </div>
              )}
              {clicked.point.periodeConstruction && (
                <div>
                  <span className="text-slate-400">Construction</span>
                  <p className="font-medium">{clicked.point.periodeConstruction}</p>
                </div>
              )}
              {clicked.point.dpeClasse && (
                <div>
                  <span className="text-slate-400">DPE</span>
                  <p className="font-medium">{clicked.point.dpeClasse}</p>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              {isPro ? (
                <>
                  <Link
                    href={`/copropriete/${clicked.point.slug}`}
                    className="flex-1 rounded-lg bg-teal-600 px-3 py-2 text-center text-xs font-medium text-white hover:bg-teal-700 transition-colors"
                  >
                    Voir la fiche &rarr;
                  </Link>
                  <button className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:text-amber-500 transition-colors">
                    <Star className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <Link
                  href="/tarifs"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Connectez-vous pour explorer
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
