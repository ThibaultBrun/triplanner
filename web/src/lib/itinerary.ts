import type { Poi } from "./poi";

export type DayItem = {
  poi: Poi;
  startMinutes: number; // minutes from midnight
  endMinutes: number;
  travelToNextMinutes: number; // travel time to the next POI of the day (0 if last)
  travelToNextKm: number;
};

export type DayPlan = {
  index: number; // 0-based
  items: DayItem[];
};

export type Itinerary = {
  days: DayPlan[];
  totalPois: number;
};

const DAY_START_MIN = 9 * 60; // 9:00
const DAY_END_MIN = 18 * 60; // 18:00 — soft limit
const TRAVEL_SPEED_KMH = 40; // mixed driving + walking
const MIN_TRAVEL_MIN = 15;
const MAX_TRAVEL_MIN = 90;

// Average visit duration per subcategory, in minutes.
// Overrides only — others default to DEFAULT_VISIT_MIN.
const DEFAULT_VISIT_MIN = 60;
const VISIT_MIN_BY_SUBCAT: Record<string, number> = {
  "Châteaux & forteresses": 90,
  "Édifices religieux": 30,
  "Sites archéologiques & préhistoriques": 60,
  "Monuments & mémoriaux": 20,
  "Architecture remarquable": 30,
  "Villages & cités historiques": 90,
  "Beaux-arts & art classique": 90,
  "Art contemporain & galeries": 75,
  "Histoire & civilisations": 90,
  "Sciences & techniques": 90,
  "Écomusées & traditions locales": 75,
  Musée: 75,
  "Street art & art urbain": 30,
  "Plages & littoral": 120,
  "Points de vue & panoramas": 20,
  "Grottes & formations rocheuses": 60,
  "Lacs, rivières & cascades": 45,
  "Réserves naturelles & faune": 90,
  "Dunes & sites géologiques": 60,
  "Surf & sports de glisse": 120,
  "Sports nautiques": 120,
  "Sports aériens": 120,
  "Escalade & via ferrata": 180,
  "Sports équestres": 120,
  "Vélo & VTT": 180,
  "Restaurants": 75,
  "Cafés & salons de thé": 30,
  "Caves & dégustation de vins": 60,
  "Marchés & halles": 45,
  "Producteurs & fermes": 45,
  "Spécialités régionales": 30,
  "Parcs d'attractions": 240,
  "Zoos & parcs animaliers": 180,
  Aquariums: 90,
  "Parcs aquatiques": 180,
  "Mini-golf & jeux": 60,
  "Activités enfants": 90,
  "Parcs & jardins": 45,
  Attractions: 60,
  "Spas & instituts": 90,
  "Thermalisme & sources chaudes": 120,
  "Yoga & retraites": 90,
  "Bars & pubs": 60,
  "Boîtes de nuit & clubs": 120,
  "Salles de concert & live music": 120,
  Théâtres: 120,
  Cinémas: 120,
  "Opéras & spectacles classiques": 150,
};

export type Pace = "express" | "standard" | "tranquille";

export const PACE_MULTIPLIER: Record<Pace, number> = {
  express: 0.6,
  standard: 1,
  tranquille: 1.5,
};

export const PACE_LABELS: Record<Pace, string> = {
  express: "🏃 Express",
  standard: "🚶 Standard",
  tranquille: "🌴 Tranquille",
};

export function visitMinutes(poi: Poi, pace: Pace = "standard"): number {
  const base = VISIT_MIN_BY_SUBCAT[poi.subcategory] ?? DEFAULT_VISIT_MIN;
  return Math.max(15, Math.round(base * PACE_MULTIPLIER[pace]));
}

// Haversine distance in km
export function distanceKm(a: Poi, b: Poi): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function travelMinutes(km: number): number {
  const raw = (km / TRAVEL_SPEED_KMH) * 60;
  return Math.round(Math.max(MIN_TRAVEL_MIN, Math.min(MAX_TRAVEL_MIN, raw)));
}

// Greedy nearest-neighbor TSP starting from the westernmost POI.
function orderByProximity(pois: Poi[]): Poi[] {
  if (pois.length <= 1) return [...pois];
  const remaining = [...pois];
  remaining.sort((a, b) => a.lon - b.lon);
  const result: Poi[] = [remaining.shift()!];
  while (remaining.length > 0) {
    const last = result[result.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = distanceKm(last, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    result.push(remaining.splice(bestIdx, 1)[0]);
  }
  return result;
}

// Split ordered POIs into N days, balancing total visit-time per day.
function splitIntoDays(ordered: Poi[], numDays: number, pace: Pace): Poi[][] {
  if (numDays <= 0) return [];
  if (ordered.length === 0) return Array.from({ length: numDays }, () => []);

  const totalDuration = ordered.reduce((s, p) => s + visitMinutes(p, pace), 0);
  const targetPerDay = totalDuration / numDays;

  const days: Poi[][] = Array.from({ length: numDays }, () => []);
  let dayIdx = 0;
  let dayDuration = 0;

  for (const poi of ordered) {
    const dur = visitMinutes(poi, pace);
    // Move to next day if current is full AND we have remaining days.
    if (dayDuration > 0 && dayDuration + dur / 2 > targetPerDay && dayIdx < numDays - 1) {
      dayIdx++;
      dayDuration = 0;
    }
    days[dayIdx].push(poi);
    dayDuration += dur;
  }

  return days;
}

function buildDayPlan(dayPois: Poi[], dayIndex: number, pace: Pace): DayPlan {
  if (dayPois.length === 0) return { index: dayIndex, items: [] };

  const items: DayItem[] = [];
  let cursor = DAY_START_MIN;

  for (let i = 0; i < dayPois.length; i++) {
    const poi = dayPois[i];
    const visit = visitMinutes(poi, pace);
    const startMinutes = cursor;
    const endMinutes = cursor + visit;

    let travelToNextMinutes = 0;
    let travelToNextKm = 0;
    if (i < dayPois.length - 1) {
      travelToNextKm = distanceKm(poi, dayPois[i + 1]);
      travelToNextMinutes = travelMinutes(travelToNextKm);
    }

    items.push({ poi, startMinutes, endMinutes, travelToNextMinutes, travelToNextKm });
    cursor = endMinutes + travelToNextMinutes;
  }

  return { index: dayIndex, items };
}

export function buildItinerary(
  pois: Poi[],
  numDays: number,
  pace: Pace = "standard",
  dayOverrides: Record<number, string[]> = {},
): Itinerary {
  const ordered = orderByProximity(pois);
  const splits = splitIntoDays(ordered, numDays, pace);
  const days = splits.map((dayPois, i) => {
    const override = dayOverrides[i];
    if (override && override.length > 0) {
      const idx = new Map(override.map((id, k) => [id, k]));
      const reordered = [...dayPois].sort((a, b) => {
        const ia = idx.get(a.id) ?? Infinity;
        const ib = idx.get(b.id) ?? Infinity;
        return ia - ib;
      });
      return buildDayPlan(reordered, i, pace);
    }
    return buildDayPlan(dayPois, i, pace);
  });
  return { days, totalPois: pois.length };
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} h`;
  return `${h} h ${m}`;
}

export function dayLabel(index: number): string {
  return `Jour ${index + 1}`;
}

export function isOverDayEnd(item: DayItem): boolean {
  return item.endMinutes > DAY_END_MIN;
}
