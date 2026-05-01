"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MlMap, Popup } from "maplibre-gl";
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

type Props = {
  itinerary: Itinerary;
  onSwap?: (idA: string, idB: string) => void;
};

type MarkerData = {
  id: string;
  lng: number;
  lat: number;
  popupHtml: string;
};

export function ItineraryMap({ itinerary, onSwap }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const popupRef = useRef<Popup | null>(null);

  // Map of POI id → marker DOM wrapper (root has the maplibre transform; inner has the visual style).
  const markerElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  // Map of POI id → marker meta needed for popup re-display.
  const markerDataRef = useRef<Map<string, MarkerData>>(new Map());

  const selectedIdRef = useRef<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const onSwapRef = useRef(onSwap);
  useEffect(() => {
    onSwapRef.current = onSwap;
  }, [onSwap]);

  function handleMarkerClick(id: string) {
    const current = selectedIdRef.current;

    // In swap mode → click resolves the swap, never opens a popup.
    if (current !== null) {
      if (current === id) {
        // Click on the highlighted marker again = cancel.
        selectedIdRef.current = null;
        setSelectedId(null);
      } else {
        selectedIdRef.current = null;
        setSelectedId(null);
        onSwapRef.current?.(current, id);
      }
      return;
    }

    // Default mode → open the popup with the swap button.
    const data = markerDataRef.current.get(id);
    const map = mapRef.current;
    const popup = popupRef.current;
    if (!data || !map || !popup) return;

    popup.setLngLat([data.lng, data.lat]).setHTML(data.popupHtml).addTo(map);

    // Wire the "Échanger" button after the popup DOM is mounted.
    queueMicrotask(() => {
      const el = popup.getElement();
      const btn = el?.querySelector("[data-swap-action]") as HTMLButtonElement | null;
      if (!btn) return;
      btn.addEventListener(
        "click",
        () => {
          popup.remove();
          selectedIdRef.current = id;
          setSelectedId(id);
        },
        { once: true },
      );
    });
  }

  // Sync visual selection state — IMPORTANT: only mutate inner div, never the
  // wrapper's transform (MapLibre uses it for pan/zoom).
  useEffect(() => {
    for (const [id, el] of markerElsRef.current) {
      const inner = el.firstElementChild as HTMLElement | null;
      if (!inner) continue;
      const isSel = id === selectedId;
      inner.style.outline = isSel ? "3px solid #fff" : "";
      inner.style.outlineOffset = isSel ? "3px" : "";
      inner.style.boxShadow = isSel
        ? "0 0 0 6px rgba(56,189,248,0.6), 0 4px 10px rgba(0,0,0,0.4)"
        : "0 2px 6px rgba(0,0,0,0.3)";
      inner.style.transform = isSel ? "scale(1.18)" : "";
      el.style.zIndex = isSel ? "10" : "";
    }
  }, [selectedId]);

  // Init map once.
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
    popupRef.current = new maplibregl.Popup({ offset: 18, maxWidth: "260px" });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    requestAnimationFrame(() => map.resize());

    map.on("load", () => {
      drawItinerary(map, itinerary, markerElsRef.current, markerDataRef.current, handleMarkerClick);
    });

    return () => {
      resizeObserver.disconnect();
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
      markerElsRef.current.clear();
      markerDataRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-draw on itinerary change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    selectedIdRef.current = null;
    setSelectedId(null);
    popupRef.current?.remove();
    if (!map.isStyleLoaded()) {
      map.once("load", () =>
        drawItinerary(map, itinerary, markerElsRef.current, markerDataRef.current, handleMarkerClick),
      );
    } else {
      drawItinerary(map, itinerary, markerElsRef.current, markerDataRef.current, handleMarkerClick);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary]);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {onSwap && selectedId && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-sky-600 px-4 py-2 text-xs font-medium text-white shadow-lg">
            <span>Cliquez sur un autre marqueur pour échanger</span>
            <button
              type="button"
              onClick={() => {
                selectedIdRef.current = null;
                setSelectedId(null);
              }}
              className="rounded-full bg-white/20 px-2 py-0.5 hover:bg-white/30"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function drawItinerary(
  map: MlMap,
  itinerary: Itinerary,
  markerEls: Map<string, HTMLDivElement>,
  markerData: Map<string, MarkerData>,
  onMarkerClick: (id: string) => void,
) {
  // Remove previous markers and line layer/source.
  const previous = (map as unknown as { __itinMarkers?: maplibregl.Marker[] }).__itinMarkers ?? [];
  for (const m of previous) m.remove();
  markerEls.clear();
  markerData.clear();

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
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onMarkerClick(item.poi.id);
      });
      markerEls.set(item.poi.id, el);

      const popupHtml = `
        <div style="font-family:system-ui;max-width:240px">
          ${
            item.poi.image
              ? `<img src="${item.poi.image}" alt="" style="width:100%;height:130px;object-fit:cover;border-radius:6px;margin-bottom:8px" />`
              : ""
          }
          <div style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase;letter-spacing:0.05em">
            Jour ${dayIndex + 1} · arrêt ${stopIndex + 1}
          </div>
          <div style="font-size:14px;font-weight:600;line-height:1.3;margin-top:2px">
            ${escapeHtml(item.poi.name)}
          </div>
          ${
            item.poi.city
              ? `<div style="font-size:12px;color:#475569;margin-top:2px">📍 ${escapeHtml(item.poi.city)}</div>`
              : ""
          }
          ${
            item.poi.description
              ? `<div style="font-size:12px;color:#334155;margin-top:6px;line-height:1.4">${escapeHtml(item.poi.description)}</div>`
              : ""
          }
          <div style="font-size:12px;color:#334155;margin-top:8px;font-variant-numeric:tabular-nums">
            🕘 ${formatTime(item.startMinutes)} – ${formatTime(item.endMinutes)}
          </div>
          <button
            data-swap-action="start"
            type="button"
            style="margin-top:10px;width:100%;padding:8px 12px;border:none;border-radius:6px;background:${color};color:#fff;font-weight:600;font-size:13px;cursor:pointer"
          >
            ↔ Échanger cette étape
          </button>
        </div>
      `;

      markerData.set(item.poi.id, { id: item.poi.id, lng, lat, popupHtml });

      const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
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
  // Wrapper: MapLibre will apply `transform: translate(...)` here to follow
  // the map's pan/zoom — never override it.
  const wrapper = document.createElement("div");
  wrapper.style.cursor = "pointer";
  wrapper.style.userSelect = "none";

  // Inner: holds all visual styles (and any scale we want to apply on select).
  const inner = document.createElement("div");
  inner.style.cssText = `
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
    transition: transform 120ms ease, box-shadow 120ms ease, outline 120ms ease;
  `;
  inner.textContent = String(label);
  wrapper.appendChild(inner);
  return wrapper;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
