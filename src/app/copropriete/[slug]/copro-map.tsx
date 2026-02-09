"use client";

import { useEffect, useRef } from "react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function CoproMap({
  longitude,
  latitude,
  label,
}: {
  longitude: number;
  latitude: number;
  label: string;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainer.current || mapRef.current) return;

    let map: mapboxgl.Map;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;

      map = new mapboxgl.Map({
        container: mapContainer.current!,
        accessToken: MAPBOX_TOKEN,
        style: "mapbox://styles/mapbox/light-v11",
        center: [longitude, latitude],
        zoom: 16,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(new mapboxgl.AttributionControl({ compact: true }));

      // Custom marker
      const markerEl = document.createElement("div");
      markerEl.innerHTML = `<svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24C32 7.163 24.837 0 16 0z" fill="#10B981"/>
        <circle cx="16" cy="16" r="8" fill="white"/>
      </svg>`;
      markerEl.style.cursor = "pointer";

      new mapboxgl.Marker({ element: markerEl })
        .setLngLat([longitude, latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<p style="font-size:13px;font-weight:500;margin:0;padding:4px 0">${label}</p>`
          )
        )
        .addTo(map);

      mapRef.current = map;
    })();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [longitude, latitude, label]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <svg className="mb-2 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <p className="text-sm font-medium">Carte non disponible</p>
        <p className="mt-1 text-xs">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
        <p className="mt-2 text-xs text-slate-300">
          Ajoutez NEXT_PUBLIC_MAPBOX_TOKEN dans .env.local
        </p>
      </div>
    );
  }

  return <div ref={mapContainer} className="h-full min-h-[300px] rounded-lg" />;
}
