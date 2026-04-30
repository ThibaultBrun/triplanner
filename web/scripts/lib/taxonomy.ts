import type { Category } from "../../src/lib/poi";

export type TagDict = Record<string, string>;

type Rule = {
  match: (t: TagDict) => boolean;
  category: Category;
  subcategory: string;
};

const has = (t: TagDict, key: string, values: string[]) =>
  t[key] !== undefined && values.includes(t[key]);

const any = (t: TagDict, keys: string[]) =>
  keys.some((k) => t[k] !== undefined);

// Order matters: first match wins (priorité figée).
// Source: doc/03-taxonomie.md
const rules: Rule[] = [
  // 1. Patrimoine & Monuments
  { category: "patrimoine", subcategory: "Châteaux & forteresses",
    match: (t) => has(t, "historic", ["castle", "fort", "fortification"]) },
  { category: "patrimoine", subcategory: "Édifices religieux",
    match: (t) => t.amenity === "place_of_worship" || has(t, "building", ["church", "cathedral", "monastery", "chapel"]) },
  { category: "patrimoine", subcategory: "Sites archéologiques & préhistoriques",
    match: (t) => has(t, "historic", ["archaeological_site", "ruins", "megalith", "tomb"]) },
  { category: "patrimoine", subcategory: "Monuments & mémoriaux",
    match: (t) => has(t, "historic", ["monument", "memorial", "wayside_cross"]) },
  { category: "patrimoine", subcategory: "Architecture remarquable",
    match: (t) => t.man_made === "lighthouse" || t.man_made === "bridge" || has(t, "historic", ["building"]) },
  { category: "patrimoine", subcategory: "Villages & cités historiques",
    match: (t) => t.place === "village" && t.historic !== undefined },

  // 2. Musées & Art
  { category: "musees", subcategory: "Beaux-arts & art classique",
    match: (t) => t.tourism === "museum" && t.museum === "art" },
  { category: "musees", subcategory: "Art contemporain & galeries",
    match: (t) => t.tourism === "gallery" || (t.tourism === "museum" && (t.museum === "modern_art" || t.museum === "contemporary")) },
  { category: "musees", subcategory: "Histoire & civilisations",
    match: (t) => t.tourism === "museum" && has(t, "museum", ["history", "local", "archaeological"]) },
  { category: "musees", subcategory: "Sciences & techniques",
    match: (t) => t.tourism === "museum" && has(t, "museum", ["science", "technology", "transport", "aviation"]) },
  { category: "musees", subcategory: "Écomusées & traditions locales",
    match: (t) => t.tourism === "museum" && has(t, "museum", ["ethnography", "open_air"]) },
  { category: "musees", subcategory: "Musée",
    match: (t) => t.tourism === "museum" },
  { category: "musees", subcategory: "Street art & art urbain",
    match: (t) => t.tourism === "artwork" },

  // 3. Nature & Paysages
  { category: "nature", subcategory: "Plages & littoral",
    match: (t) => t.natural === "beach" || t.leisure === "beach_resort" },
  { category: "nature", subcategory: "Points de vue & panoramas",
    match: (t) => t.tourism === "viewpoint" || t.natural === "peak" },
  { category: "nature", subcategory: "Grottes & formations rocheuses",
    match: (t) => has(t, "natural", ["cave_entrance", "arch", "cliff", "rock"]) },
  { category: "nature", subcategory: "Lacs, rivières & cascades",
    match: (t) => t.natural === "waterfall" || t.water === "lake" || t.natural === "spring" },
  { category: "nature", subcategory: "Réserves naturelles & faune",
    match: (t) => t.boundary === "protected_area" || t.leisure === "nature_reserve" },
  { category: "nature", subcategory: "Dunes & sites géologiques",
    match: (t) => has(t, "natural", ["dune", "sand"]) },

  // 4. Sport & Aventure
  { category: "sport", subcategory: "Surf & sports de glisse",
    match: (t) => has(t, "sport", ["surfing", "kitesurfing", "windsurfing", "water_ski", "skating", "skateboard", "skiing"]) || t.leisure === "surf_school" || t.leisure === "ice_rink" },
  { category: "sport", subcategory: "Sports nautiques",
    match: (t) => has(t, "sport", ["canoe", "sailing", "scuba_diving", "kayak", "rafting", "swimming", "fishing"]) || t.leisure === "marina" || t.leisure === "swimming_pool" },
  { category: "sport", subcategory: "Sports aériens",
    match: (t) => has(t, "sport", ["paragliding", "parachuting", "hang_gliding"]) },
  { category: "sport", subcategory: "Escalade & via ferrata",
    match: (t) => has(t, "sport", ["climbing", "via_ferrata", "bouldering"]) || t.leisure === "climbing" },
  { category: "sport", subcategory: "Sports équestres",
    match: (t) => t.sport === "equestrian" || t.leisure === "horse_riding" },
  { category: "sport", subcategory: "Randonnée & trek",
    match: (t) => has(t, "sport", ["hiking", "trail_running"]) },
  { category: "sport", subcategory: "Vélo & VTT",
    match: (t) => t.sport === "cycling" },
  { category: "sport", subcategory: "Sports collectifs & raquette",
    match: (t) => has(t, "sport", ["tennis", "golf", "football", "rugby", "basketball", "volleyball", "table_tennis", "martial_arts", "pelota"]) || t.leisure === "golf_course" },
  { category: "sport", subcategory: "Centres sportifs & stades",
    match: (t) => has(t, "leisure", ["sports_centre", "fitness_centre", "stadium", "sports_hall", "track"]) },

  // 7. Bien-être (avant gastronomie pour capter spa, yoga avant amenity)
  { category: "bien-etre", subcategory: "Spas & instituts",
    match: (t) => t.leisure === "spa" || t.shop === "massage" },
  { category: "bien-etre", subcategory: "Thermalisme & sources chaudes",
    match: (t) => t.amenity === "public_bath" || t.natural === "hot_spring" },
  { category: "bien-etre", subcategory: "Yoga & retraites",
    match: (t) => t.sport === "yoga" || t.amenity === "yoga_centre" },

  // 8. Vie nocturne & Spectacles (avant gastro restaurants pour capter bars)
  { category: "vie-nocturne", subcategory: "Bars & pubs",
    match: (t) => has(t, "amenity", ["bar", "pub", "biergarten"]) },
  { category: "vie-nocturne", subcategory: "Boîtes de nuit & clubs",
    match: (t) => t.amenity === "nightclub" || t.amenity === "stripclub" || t.leisure === "dance" },
  { category: "vie-nocturne", subcategory: "Salles de concert & live music",
    match: (t) => has(t, "amenity", ["music_venue", "concert_hall", "events_venue"]) },
  { category: "vie-nocturne", subcategory: "Théâtres",
    match: (t) => t.amenity === "theatre" },
  { category: "vie-nocturne", subcategory: "Cinémas",
    match: (t) => t.amenity === "cinema" },
  { category: "vie-nocturne", subcategory: "Opéras & spectacles classiques",
    match: (t) => t.amenity === "opera_house" },
  { category: "vie-nocturne", subcategory: "Casinos & jeux",
    match: (t) => t.amenity === "casino" || t.leisure === "casino" || t.leisure === "amusement_arcade" },
  { category: "vie-nocturne", subcategory: "Centres culturels & arts",
    match: (t) => has(t, "amenity", ["arts_centre", "community_centre"]) },

  // 5. Gastronomie & Terroir
  { category: "gastronomie", subcategory: "Cafés & salons de thé",
    match: (t) => has(t, "amenity", ["cafe", "ice_cream"]) || t.shop === "tea" },
  { category: "gastronomie", subcategory: "Caves & dégustation de vins",
    match: (t) => t.craft === "winery" || t.shop === "wine" || t.tourism === "wine_cellar" },
  { category: "gastronomie", subcategory: "Marchés & halles",
    match: (t) => t.amenity === "marketplace" || t.shop === "marketplace" },
  { category: "gastronomie", subcategory: "Producteurs & fermes",
    match: (t) => t.shop === "farm" || t.tourism === "farm" || t.craft === "cheesemaker" },
  { category: "gastronomie", subcategory: "Spécialités régionales",
    match: (t) => has(t, "craft", ["confectionery", "chocolate", "distillery"]) },
  { category: "gastronomie", subcategory: "Restaurants",
    match: (t) => has(t, "amenity", ["restaurant", "fast_food", "food_court"]) },

  // 6. Loisirs & Famille
  { category: "loisirs", subcategory: "Parcs d'attractions",
    match: (t) => t.tourism === "theme_park" },
  { category: "loisirs", subcategory: "Zoos & parcs animaliers",
    match: (t) => t.tourism === "zoo" },
  { category: "loisirs", subcategory: "Aquariums",
    match: (t) => t.tourism === "aquarium" },
  { category: "loisirs", subcategory: "Parcs aquatiques",
    match: (t) => t.leisure === "water_park" },
  { category: "loisirs", subcategory: "Mini-golf & jeux",
    match: (t) => has(t, "leisure", ["miniature_golf", "amusement_arcade"]) },
  { category: "loisirs", subcategory: "Activités enfants",
    match: (t) => has(t, "leisure", ["escape_game", "adventure_park"]) },
  { category: "loisirs", subcategory: "Parcs & jardins",
    match: (t) => has(t, "leisure", ["park", "garden", "botanical_garden"]) },

  // Fallback — tourism=attraction sans rien d'autre
  { category: "loisirs", subcategory: "Attractions",
    match: (t) => t.tourism === "attraction" },
];

export function categorize(tags: TagDict): { category: Category; subcategory: string } | null {
  for (const rule of rules) {
    if (rule.match(tags)) return { category: rule.category, subcategory: rule.subcategory };
  }
  return null;
}

export function isCandidateTag(tags: TagDict): boolean {
  // Cheap pre-filter to avoid running all rules on every node.
  return any(tags, ["tourism", "historic", "amenity", "leisure", "natural", "sport", "craft"]) ||
    has(tags, "shop", ["wine", "farm", "chocolate", "tea", "marketplace", "massage"]) ||
    has(tags, "building", ["church", "cathedral", "monastery", "chapel"]) ||
    t_has_manmade(tags);
}

function t_has_manmade(t: TagDict) {
  return t.man_made === "lighthouse" || t.man_made === "bridge";
}
