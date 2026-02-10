"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

function scoreColor(score: number | null): string {
  if (score === null) return "#94A3B8";
  if (score >= 70) return "#0D9488";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

export interface SearchMapMarker {
  id: number;
  slug: string | null;
  label: string;
  scoreGlobal: number | null;
  latitude: number;
  longitude: number;
}

function FitBounds({ markers }: { markers: SearchMapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].latitude, markers[0].longitude], 16);
      return;
    }
    const bounds = L.latLngBounds(
      markers.map((m) => [m.latitude, m.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
  }, [map, markers]);

  return null;
}

export default function SearchMap({
  results,
}: {
  results: SearchMapMarker[];
}) {
  if (results.length === 0) return null;

  return (
    <MapContainer
      center={[results[0].latitude, results[0].longitude]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: 250, borderRadius: "0.75rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds markers={results} />
      {results.map((r) => (
        <CircleMarker
          key={r.id}
          center={[r.latitude, r.longitude]}
          radius={9}
          pathOptions={{
            color: "#fff",
            weight: 2,
            fillColor: scoreColor(r.scoreGlobal),
            fillOpacity: 0.9,
          }}
        >
          <Popup>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <p style={{ fontWeight: 600, margin: "0 0 4px" }}>{r.label}</p>
              {r.scoreGlobal != null && (
                <p style={{ margin: "0 0 6px", color: scoreColor(r.scoreGlobal), fontWeight: 600 }}>
                  Score : {r.scoreGlobal}/100
                </p>
              )}
              <a
                href={`/copropriete/${r.slug ?? r.id}`}
                style={{ color: "#0D9488", textDecoration: "underline", fontSize: 12 }}
              >
                Voir la fiche &rarr;
              </a>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
