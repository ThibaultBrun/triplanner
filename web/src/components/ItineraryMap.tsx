"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MlMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Itinerary } from "@/lib/itinerary";
import { formatTime } from "@/lib/itinerary";

const DAY_COLORS = [
  "#dc2626", // day 1: red
  "#2563eb", // day 2: blue
  "#16a34a", // day 3: green
  "#ca8a04", // day 4: yellow
  "#9333ea", // day 5: purple
  "#0891b2", // day 6: cyan
  "#db2777", // day 7: pink
  "#ea580c", // day 8: orange
];

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export function ItineraryMap({ itinerary }: { itinerary: Itinerary }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-1.4, 43.32],
      zoom: 9,
    });

    map.on("error", (e) => console.error("[ItineraryMap]", e));
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    requestAnimationFrame(() => map.resize());

    map.on("load", () => {
      drawItinerary(map, itinerary);
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-draw when itinerary changes (after first mount).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.isStyleLoaded()) {
      map.once("load", () => drawItinerary(map, itinerary));
    } else {
      drawItinerary(map, itinerary);
    }
  }, [itinerary]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}

function drawItinerary(map: MlMap, itinerary: Itinerary) {
  // Remove previous markers and line layer/source if any.
  const existingMarkers = (map as unknown as { __itinMarkers?: maplibregl.Marker[] }).__itinMarkers ?? [];
  for (const m of existingMarkers) m.remove();

  if (map.getLayer("itin-lines")) map.removeLayer("itin-lines");
  if (map.getSource("itin-lines")) map.removeSource("itin-lines");

  const newMarkers: maplibregl.Marker[] = [];
  const lineFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  const allCoords: [number, number][] = [];

  itinerary.days.forEach((day, dayIndex) => {
    const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
    const lineCoords: [number, number][] = [];

    day.items.forEach((item, stopIndex) => {
      const lng = item.poi.lon;
      const lat = item.poi.lat;
      lineCoords.push([lng, lat]);
      allCoords.push([lng, lat]);

      const el = buildMarkerElement(stopIndex + 1, color);
      const popupHtml = `
        <div style="font-family:system-ui;max-width:220px">
          <div style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase;letter-spacing:0.05em">
            Jour ${dayIndex + 1} · arrêt ${stopIndex + 1}
          </div>
          <div style="font-size:14px;font-weight:600;line-height:1.3;margin-top:2px">
            ${escapeHtml(item.poi.name)}
          </div>
          ${item.poi.city ? `<div style="font-size:12px;color:#475569;margin-top:2px">📍 ${escapeHtml(item.poi.city)}</div>` : ""}
          <div style="font-size:12px;color:#334155;margin-top:6px;font-variant-numeric:tabular-nums">
            ${formatTime(item.startMinutes)} – ${formatTime(item.endMinutes)}
          </div>
        </div>
      `;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ offset: 18 }).setHTML(popupHtml))
        .addTo(map);
      newMarkers.push(marker);
    });

    if (lineCoords.length >= 2) {
      lineFeatures.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: lineCoords },
        properties: { color },
      });
    }
  });

  (map as unknown as { __itinMarkers?: maplibregl.Marker[] }).__itinMarkers = newMarkers;

  if (lineFeatures.length > 0) {
    map.addSource("itin-lines", {
      type: "geojson",
      data: { type: "FeatureCollection", features: lineFeatures },
    });
    map.addLayer({
      id: "itin-lines",
      type: "line",
      source: "itin-lines",
      paint: {
        "line-color": ["get", "color"],
        "line-width": 3,
        "line-opacity": 0.65,
        "line-dasharray": [2, 1.5],
      },
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    });
  }

  if (allCoords.length > 0) {
    const lons = allCoords.map((c) => c[0]);
    const lats = allCoords.map((c) => c[1]);
    map.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding: 60, duration: 0, maxZoom: 13 },
    );
  }
}

function buildMarkerElement(label: number, color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${color};
    color: #fff;
    font: 600 13px system-ui, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: pointer;
    user-select: none;
  `;
  el.textContent = String(label);
  return el;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
