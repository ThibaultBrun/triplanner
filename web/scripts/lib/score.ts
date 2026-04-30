import type { TagDict } from "./taxonomy";
import type { WikidataInfo } from "./wikidata";

const BOOSTED_SUBCATS = new Set([
  "Châteaux & forteresses",
  "Beaux-arts & art classique",
  "Plages & littoral",
  "Points de vue & panoramas",
  "Édifices religieux",
  "Sites archéologiques & préhistoriques",
]);

const PENALIZED_SUBCATS = new Set([
  "Bars & pubs",
  "Cafés & salons de thé",
  "Restaurants",
  "Cinémas",
]);

function osmCompleteness(tags: TagDict): number {
  const features = ["description", "wikipedia", "image", "website", "opening_hours", "phone", "operator"];
  const present = features.filter((k) => tags[k] !== undefined).length;
  return present / features.length; // 0..1
}

function isHeritageNational(tags: TagDict): boolean {
  // OSM: heritage:operator=mhs or heritage=2 indicates "Monument historique" in France
  return (
    tags["heritage:operator"] === "mhs" ||
    tags.heritage === "2" ||
    (tags.heritage === "yes" && tags["heritage:operator"] !== undefined)
  );
}

export function computeScore(
  tags: TagDict,
  subcategory: string,
  wd: WikidataInfo | undefined,
): number {
  const wikidataPresent = wd !== undefined;
  const wikipediaLangs = wd?.wikipediaLangs ?? 0;
  const unesco = wd?.isUnesco ?? false;
  const heritageNat = isHeritageNational(tags);
  const completeness = osmCompleteness(tags);
  const hasImage = (wd?.image !== undefined) || tags.image !== undefined;
  const hasOpeningHours = tags.opening_hours !== undefined;

  let raw =
    (wikidataPresent ? 10 : 0) +
    Math.min(wikipediaLangs, 17) * 3 +
    (unesco ? 30 : 0) +
    (heritageNat ? 15 : 0) +
    completeness * 5 +
    (hasImage ? 5 : 0) +
    (hasOpeningHours ? 3 : 0);

  let boost = 1.0;
  if (BOOSTED_SUBCATS.has(subcategory)) boost = 1.2;
  else if (PENALIZED_SUBCATS.has(subcategory)) boost = 0.7;

  raw *= boost;

  return Math.min(100, raw) / 100;
}
