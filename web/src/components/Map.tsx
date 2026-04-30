"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MlMap, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { Poi, Category } from "@/lib/poi";

const CATEGORY_COLORS: Record<Category, string> = {
  patrimoine: "#92400e",
  musees: "#7c3aed",
  nature: "#059669",
  sport: "#ea580c",
  gastronomie: "#dc2626",
  loisirs: "#0ea5e9",
  "bien-etre": "#f472b6",
  "vie-nocturne": "#4338ca",
};

// Pays Basque français
const INITIAL_CENTER: [number, number] = [-1.4, 43.32];
const INITIAL_ZOOM = 9.5;

export function Map({ pois }: { pois: Poi[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // OpenFreeMap: vector style, free, no API key.
      // Other options: "positron" (clean light), "bright", "dark"
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    mapRef.current = map;

    map.on("load", () => {
      const features = pois.map((p) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] },
        properties: {
          id: p.id,
          name: p.name,
          category: p.category,
          subcategory: p.subcategory,
          description: p.description ?? "",
          image: p.image ?? "",
          score: p.score,
          color: CATEGORY_COLORS[p.category],
        },
      }));

      map.addSource("pois", {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });

      map.addLayer({
        id: "pois-circles",
        type: "circle",
        source: "pois",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "score"],
            0, 4,
            1, 10,
          ],
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });

      map.on("click", "pois-circles", (e) => {
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        const [lon, lat] = f.geometry.coordinates as [number, number];
        const props = f.properties as {
          name: string;
          subcategory: string;
          description: string;
          image: string;
        };

        const html = `
          <div style="max-width:240px;font-family:system-ui">
            ${props.image ? `<img src="${props.image}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:6px;margin-bottom:8px" />` : ""}
            <div style="font-weight:600;font-size:14px;line-height:1.3">${escapeHtml(props.name)}</div>
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px">${escapeHtml(props.subcategory)}</div>
            ${props.description ? `<div style="font-size:12px;color:#334155;margin-top:6px;line-height:1.4">${escapeHtml(props.description)}</div>` : ""}
          </div>
        `;

        new Popup({ offset: 12, maxWidth: "260px" })
          .setLngLat([lon, lat])
          .setHTML(html)
          .addTo(map);
      });

      map.on("mouseenter", "pois-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "pois-circles", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [pois]);

  return <div ref={containerRef} className="absolute inset-0" />;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
