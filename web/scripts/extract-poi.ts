import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { Category, Poi } from "../src/lib/poi";
import { categorize, isCandidateTag } from "./lib/taxonomy";
import { fetchOverpass, getCoords, type OverpassElement } from "./lib/overpass";
import { fetchWikidata } from "./lib/wikidata";
import { computeScore } from "./lib/score";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../src/data/pois.json");

// Quotas per main category. If a category has fewer candidates than its quota,
// we take everything available. Total target: ~500 POIs, well distributed.
const QUOTAS: Record<Category, number> = {
  patrimoine: 120,
  musees: 50,
  nature: 80,
  sport: 50,
  gastronomie: 100,
  loisirs: 50,
  "bien-etre": 20,
  "vie-nocturne": 30,
};

function pickName(tags: Record<string, string>): string | null {
  return tags["name:fr"] ?? tags.name ?? tags["name:en"] ?? null;
}

function tagCost(tags: Record<string, string>): "free" | "paid" | undefined {
  if (tags.fee === "no") return "free";
  if (tags.fee === "yes" || tags.charge !== undefined) return "paid";
  return undefined;
}

function tagWheelchair(tags: Record<string, string>): "yes" | "limited" | "no" | undefined {
  const v = tags.wheelchair;
  if (v === "yes" || v === "limited" || v === "no") return v;
  return undefined;
}

async function main() {
  console.log(`[1/4] Fetching POI candidates from Overpass...`);
  const elements = await fetchOverpass();
  console.log(`     → ${elements.length} elements returned`);

  // Filter: must have name + coords + match a taxonomy rule.
  type Candidate = {
    el: OverpassElement;
    tags: Record<string, string>;
    coords: { lat: number; lon: number };
    name: string;
    category: ReturnType<typeof categorize>;
  };

  const candidates: Candidate[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    if (!isCandidateTag(tags)) continue;
    const name = pickName(tags);
    if (!name) continue;
    const coords = getCoords(el);
    if (!coords) continue;
    const cat = categorize(tags);
    if (!cat) continue;
    candidates.push({ el, tags, coords, name, category: cat });
  }
  console.log(`[2/4] ${candidates.length} candidates after taxonomy filter`);

  // Collect unique QIDs for Wikidata enrichment
  const qids = candidates
    .map((c) => c.tags.wikidata)
    .filter((q): q is string => typeof q === "string" && /^Q\d+$/.test(q));
  console.log(`     → ${new Set(qids).size} unique Wikidata QIDs to fetch`);

  console.log(`[3/4] Enriching from Wikidata...`);
  const wdMap = await fetchWikidata(qids);
  console.log(`     → ${wdMap.size} entities enriched`);

  // Build final POIs with scores
  const pois: Poi[] = candidates.map((c) => {
    const wd = c.tags.wikidata ? wdMap.get(c.tags.wikidata) : undefined;
    const cat = c.category!;
    const score = computeScore(c.tags, cat.subcategory, wd);

    const city =
      c.tags["addr:city"] ??
      c.tags["is_in:town"] ??
      c.tags["is_in:village"] ??
      c.tags["is_in:city"] ??
      undefined;

    const poi: Poi = {
      id: `${c.el.type}/${c.el.id}`,
      osm: { type: c.el.type, id: c.el.id },
      wikidata: c.tags.wikidata,
      name: c.name,
      city,
      lat: c.coords.lat,
      lon: c.coords.lon,
      category: cat.category,
      subcategory: cat.subcategory,
      description: wd?.description,
      image: wd?.image,
      wikipediaLangs: wd?.wikipediaLangs ?? 0,
      score,
    };

    const tags: NonNullable<Poi["tags"]> = {};
    const cost = tagCost(c.tags);
    if (cost) tags.cost = cost;
    const wc = tagWheelchair(c.tags);
    if (wc) tags.wheelchair = wc;
    if (c.tags.cuisine) tags.cuisine = c.tags.cuisine.split(";").map((s) => s.trim());
    if (c.tags.opening_hours) tags.openingHours = c.tags.opening_hours;
    if (c.tags.website) tags.website = c.tags.website;
    if (Object.keys(tags).length > 0) poi.tags = tags;

    return poi;
  });

  // Group by category, take top N per category according to quotas
  const byCat = new Map<Category, Poi[]>();
  for (const p of pois) {
    const list = byCat.get(p.category) ?? [];
    list.push(p);
    byCat.set(p.category, list);
  }

  const top: Poi[] = [];
  for (const [cat, list] of byCat) {
    list.sort((a, b) => b.score - a.score);
    const quota = QUOTAS[cat];
    top.push(...list.slice(0, quota));
  }
  top.sort((a, b) => b.score - a.score);

  console.log(`[4/4] Writing ${top.length} POIs (per-category quotas) to ${OUTPUT_PATH}`);
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(top, null, 2) + "\n");

  // Summary
  const counts: Record<string, number> = {};
  for (const p of top) counts[p.category] = (counts[p.category] ?? 0) + 1;
  console.log(`\nBreakdown by category:`);
  for (const [cat, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(15)} ${n}`);
  }
  const withWd = top.filter((p) => p.wikidata).length;
  const withImg = top.filter((p) => p.image).length;
  console.log(`\n  with Wikidata: ${withWd}/${top.length}`);
  console.log(`  with image:    ${withImg}/${top.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
