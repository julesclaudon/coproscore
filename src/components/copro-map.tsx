"use client";

import { MapContainer, TileLayer, Marker, CircleMarker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function scoreColor(score: number | null): string {
  if (score === null) return "#94A3B8";
  if (score >= 70) return "#0D9488";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

const mainIcon = L.divIcon({
  className: "",
  html: `<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24C32 7.163 24.837 0 16 0z" fill="#0D9488"/>
    <circle cx="16" cy="16" r="8" fill="white"/>
  </svg>`,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

export interface NearbyMarker {
  id: number;
  slug: string | null;
  label: string;
  scoreGlobal: number | null;
  latitude: number;
  longitude: number;
}

export default function CoproMap({
  latitude,
  longitude,
  label,
  nearby = [],
}: {
  latitude: number;
  longitude: number;
  label: string;
  nearby?: NearbyMarker[];
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={16}
      scrollWheelZoom={false}
      style={{ height: "100%", minHeight: 300 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={mainIcon}>
        <Popup>
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0, padding: "4px 0" }}>
            {label}
          </p>
        </Popup>
      </Marker>
      {nearby.map((n) => (
        <CircleMarker
          key={n.id}
          center={[n.latitude, n.longitude]}
          radius={8}
          pathOptions={{
            color: "#fff",
            weight: 2,
            fillColor: scoreColor(n.scoreGlobal),
            fillOpacity: 0.85,
          }}
        >
          <Popup>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <p style={{ fontWeight: 600, margin: "0 0 4px" }}>{n.label}</p>
              {n.scoreGlobal != null && (
                <p style={{ margin: "0 0 6px", color: scoreColor(n.scoreGlobal), fontWeight: 600 }}>
                  Score : {n.scoreGlobal}/100
                </p>
              )}
              <a
                href={`/copropriete/${n.slug ?? n.id}`}
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
