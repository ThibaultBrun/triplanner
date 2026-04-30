const API_URL = "https://www.wikidata.org/w/api.php";
const USER_AGENT = "Triplanner-Extract/0.1 (https://github.com/ThibaultBrun/triplanner)";

export type WikidataInfo = {
  qid: string;
  description?: string;
  image?: string;
  wikipediaLangs: number;
  isUnesco: boolean;
};

type WdEntity = {
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: unknown } } }>>;
  sitelinks?: Record<string, { url?: string }>;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function commonsImageUrl(filename: string): string {
  // Wikimedia Commons direct file path with thumbnail width
  const cleaned = filename.replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(cleaned)}?width=800`;
}

function parseEntity(qid: string, entity: WdEntity): WikidataInfo {
  const description =
    entity.descriptions?.fr?.value ??
    entity.descriptions?.en?.value;

  const imageClaim = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  const image = typeof imageClaim === "string" ? commonsImageUrl(imageClaim) : undefined;

  // Count Wikipedia sitelinks (keys ending in 'wiki' but excluding meta wikis).
  const META = new Set(["commonswiki", "specieswiki", "wikidatawiki", "metawiki", "mediawikiwiki", "sourceswiki", "wikimaniawiki"]);
  let wikipediaLangs = 0;
  if (entity.sitelinks) {
    for (const key of Object.keys(entity.sitelinks)) {
      if (key.endsWith("wiki") && !key.endsWith("wiktionary") && !META.has(key)) {
        wikipediaLangs++;
      }
    }
  }

  // UNESCO heritage: P1435 = heritage designation; QID for World Heritage Site = Q9259
  const heritageClaims = entity.claims?.P1435 ?? [];
  const isUnesco = heritageClaims.some((c) => {
    const v = c.mainsnak?.datavalue?.value as { id?: string } | undefined;
    return v?.id === "Q9259";
  });

  return { qid, description, image, wikipediaLangs, isUnesco };
}

export async function fetchWikidata(qids: string[]): Promise<Map<string, WikidataInfo>> {
  const result = new Map<string, WikidataInfo>();
  if (qids.length === 0) return result;

  const batches = chunk([...new Set(qids)], 50);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const url = new URL(API_URL);
    url.searchParams.set("action", "wbgetentities");
    url.searchParams.set("ids", batch.join("|"));
    url.searchParams.set("props", "descriptions|claims|sitelinks");
    url.searchParams.set("languages", "fr|en");
    url.searchParams.set("format", "json");

    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

    if (!res.ok) {
      throw new Error(`Wikidata HTTP ${res.status} on batch ${i + 1}/${batches.length}`);
    }

    const json = (await res.json()) as { entities?: Record<string, WdEntity> };
    if (json.entities) {
      for (const [id, entity] of Object.entries(json.entities)) {
        result.set(id, parseEntity(id, entity));
      }
    }

    // Politeness delay between batches
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return result;
}
