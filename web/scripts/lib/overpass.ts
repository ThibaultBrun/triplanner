import type { TagDict } from "./taxonomy";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Bbox Pays Basque français (avec un peu de marge).
// south, west, north, east
export const BBOX = "43.10,-1.85,43.55,-0.85";

export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: TagDict;
};

const QUERY = `
[out:json][timeout:90];
(
  node["tourism"](${BBOX});
  way["tourism"](${BBOX});
  relation["tourism"](${BBOX});
  node["historic"](${BBOX});
  way["historic"](${BBOX});
  relation["historic"](${BBOX});
  node["amenity"~"^(restaurant|cafe|bar|pub|theatre|cinema|nightclub|biergarten|opera_house|music_venue|concert_hall|marketplace|public_bath|place_of_worship|fast_food|food_court|ice_cream|yoga_centre|casino|arts_centre|events_venue|community_centre|stripclub)$"](${BBOX});
  way["amenity"~"^(theatre|cinema|nightclub|opera_house|music_venue|concert_hall|marketplace|public_bath|place_of_worship|casino|arts_centre|events_venue)$"](${BBOX});
  node["leisure"~"^(park|garden|botanical_garden|beach_resort|water_park|theme_park|spa|nature_reserve|miniature_golf|amusement_arcade|escape_game|adventure_park|surf_school|marina|horse_riding|sports_centre|fitness_centre|swimming_pool|golf_course|stadium|track|sports_hall|dance|ice_rink|bowling_alley|trampoline_park|climbing|sauna|skatepark)$"](${BBOX});
  way["leisure"~"^(park|garden|botanical_garden|beach_resort|water_park|theme_park|spa|nature_reserve|adventure_park|marina|sports_centre|fitness_centre|swimming_pool|golf_course|stadium|sports_hall|skatepark)$"](${BBOX});
  // playgrounds: only "named" ones (avoids residential micro-aires)
  node["leisure"="playground"]["name"](${BBOX});
  way["leisure"="playground"]["name"](${BBOX});
  node["attraction"](${BBOX});
  node["tourism"="hotel"]["spa"](${BBOX});
  node["natural"~"^(beach|peak|waterfall|cave_entrance|dune|hot_spring|spring|arch|cliff|rock|sand)$"](${BBOX});
  way["natural"~"^(beach|peak|waterfall|cave_entrance|dune|hot_spring|spring|arch|cliff|rock|sand)$"](${BBOX});
  node["shop"~"^(wine|farm|chocolate|tea|massage|marketplace)$"](${BBOX});
  node["craft"~"^(winery|distillery|chocolate|cheesemaker|confectionery)$"](${BBOX});
  node["sport"~"^(surfing|kitesurfing|canoe|sailing|scuba_diving|paragliding|parachuting|climbing|via_ferrata|equestrian|cycling|yoga|tennis|golf|swimming|skating|hiking|bouldering|skateboard|skiing|fishing|windsurfing|water_ski|kayak|rafting|hang_gliding|football|rugby|basketball|volleyball|martial_arts|trail_running|table_tennis|pelota|mtb|bmx)$"](${BBOX});
  // VTT trails (relation routes)
  relation["route"~"^(mtb|bicycle)$"]["name"](${BBOX});
  node["man_made"~"^(lighthouse|bridge)$"](${BBOX});
  way["man_made"~"^(lighthouse|bridge)$"](${BBOX});
);
out center tags;
`.trim();

export async function fetchOverpass(): Promise<OverpassElement[]> {
  const body = new URLSearchParams({ data: QUERY }).toString();

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Triplanner-Extract/0.1 (https://github.com/ThibaultBrun/triplanner)",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Overpass HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  const json = (await res.json()) as { elements: OverpassElement[] };
  return json.elements;
}

export function getCoords(el: OverpassElement): { lat: number; lon: number } | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lon: el.lon };
  }
  if (el.center) return el.center;
  return null;
}
