export type Category =
  | "patrimoine"
  | "musees"
  | "nature"
  | "sport"
  | "gastronomie"
  | "loisirs"
  | "bien-etre"
  | "vie-nocturne";

export const CATEGORY_LABELS: Record<Category, string> = {
  patrimoine: "Patrimoine & Monuments",
  musees: "Musées & Art",
  nature: "Nature & Paysages",
  sport: "Sport & Aventure",
  gastronomie: "Gastronomie & Terroir",
  loisirs: "Loisirs & Famille",
  "bien-etre": "Bien-être",
  "vie-nocturne": "Vie nocturne & Spectacles",
};

export type Poi = {
  id: string;
  osm: { type: "node" | "way" | "relation"; id: number };
  wikidata?: string;
  name: string;
  lat: number;
  lon: number;
  category: Category;
  subcategory: string;
  description?: string;
  image?: string;
  wikipediaLangs: number;
  score: number;
  tags?: {
    cost?: "free" | "paid";
    wheelchair?: "yes" | "limited" | "no";
    cuisine?: string[];
    openingHours?: string;
    website?: string;
  };
};
