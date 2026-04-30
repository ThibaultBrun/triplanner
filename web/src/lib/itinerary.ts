import type { Poi } from "./poi";

export type DayItem = {
  poi: Poi;
  startMinutes: number; // minutes from midnight
  endMinutes: number;
  travelToNextMinutes: number; // travel time to the next POI of the day (0 if last)
  travelToNextKm: number;
};

export type MealKind = "lunch" | "dinner";

export type MealEntry = {
  kind: MealKind;
  startMinutes: number;
  endMinutes: number;
  /** Position in the day's timeline (0-based slot index between items). */
  position: number;
};

export type DayPlan = {
  index: number; // 0-based
  items: DayItem[];
  meals: MealEntry[];
};

export type MealConfig = {
  lunchStartMinutes: number;
  lunchDurationMinutes: number;
  dinnerStartMinutes: number;
  dinnerDurationMinutes: number;
};

export const DEFAULT_MEAL_CONFIG: MealConfig = {
  lunchStartMinutes: 12 * 60 + 30, // 12:30
  lunchDurationMinutes: 60,
  dinnerStartMinutes: 19 * 60 + 30, // 19:30
  dinnerDurationMinutes: 90,
};

export type Itinerary = {
  days: DayPlan[];
  totalPois: number;
};

export type ItineraryOptions = {
  customDays?: Record<number, string[]>;
  customDurations?: Record<string, number>;
  dayStartMinutes?: number;
  meals?: MealConfig;
};

export const DEFAULT_DAY_START_MIN = 9 * 60; // 9:00
export const DURATION_OPTIONS_MIN = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300, 360];

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
  "Randonnée & trek": 180,
  "Sports collectifs & raquette": 90,
  "Centres sportifs & stades": 90,
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
  "Casinos & jeux": 120,
  "Centres culturels & arts": 90,
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

// Round to the nearest multiple of `step`, with a floor.
function roundToStep(minutes: number, step: number, min: number): number {
  return Math.max(min, Math.round(minutes / step) * step);
}

export function visitMinutes(poi: Poi, pace: Pace = "standard"): number {
  const base = VISIT_MIN_BY_SUBCAT[poi.subcategory] ?? DEFAULT_VISIT_MIN;
  // Quantize to 15-minute slots (15, 30, 45, 60, 75, 90, ...).
  return roundToStep(base * PACE_MULTIPLIER[pace], 15, 15);
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
  const clamped = Math.max(MIN_TRAVEL_MIN, Math.min(MAX_TRAVEL_MIN, raw));
  // Quantize travel to 5-minute slots.
  return roundToStep(clamped, 5, 5);
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

function buildDayPlan(
  dayPois: Poi[],
  dayIndex: number,
  pace: Pace,
  dayStartMin: number,
  customDurations: Record<string, number>,
  meals: MealConfig,
): DayPlan {
  if (dayPois.length === 0) return { index: dayIndex, items: [], meals: [] };

  const items: DayItem[] = [];
  const mealEntries: MealEntry[] = [];
  let cursor = dayStartMin;
  let lunchDone = false;
  let dinnerDone = false;

  function maybeInsertMeal(kind: MealKind) {
    if (kind === "lunch" && (lunchDone || cursor < meals.lunchStartMinutes)) return;
    if (kind === "dinner" && (dinnerDone || cursor < meals.dinnerStartMinutes)) return;
    const dur = kind === "lunch" ? meals.lunchDurationMinutes : meals.dinnerDurationMinutes;
    mealEntries.push({
      kind,
      startMinutes: cursor,
      endMinutes: cursor + dur,
      position: items.length, // appears after items[position - 1] in the timeline
    });
    cursor += dur;
    if (kind === "lunch") lunchDone = true;
    else dinnerDone = true;
  }

  for (let i = 0; i < dayPois.length; i++) {
    // Check meal slots before this POI's start.
    maybeInsertMeal("lunch");
    maybeInsertMeal("dinner");

    const poi = dayPois[i];
    const visit = customDurations[poi.id] ?? visitMinutes(poi, pace);
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

  // After the last POI, still try to slot dinner if we ran into it.
  maybeInsertMeal("lunch");
  maybeInsertMeal("dinner");

  return { index: dayIndex, items, meals: mealEntries };
}

export function buildItinerary(
  pois: Poi[],
  numDays: number,
  pace: Pace = "standard",
  options: ItineraryOptions = {},
): Itinerary {
  const {
    customDays,
    customDurations = {},
    dayStartMinutes = DEFAULT_DAY_START_MIN,
    meals = DEFAULT_MEAL_CONFIG,
  } = options;

  let dayPoisLists: Poi[][];

  if (customDays) {
    // Use the provided per-day assignment, then append any remaining POI
    // (newly liked or otherwise unassigned) to the last day.
    const poisById = new Map(pois.map((p) => [p.id, p]));
    dayPoisLists = Array.from({ length: numDays }, (_, i) => {
      const ids = customDays[i] ?? [];
      return ids
        .map((id) => poisById.get(id))
        .filter((p): p is Poi => p !== undefined);
    });
    const assigned = new Set(Object.values(customDays).flat());
    const orphans = pois.filter((p) => !assigned.has(p.id));
    if (orphans.length > 0 && dayPoisLists.length > 0) {
      dayPoisLists[dayPoisLists.length - 1].push(...orphans);
    }
  } else {
    const ordered = orderByProximity(pois);
    dayPoisLists = splitIntoDays(ordered, numDays, pace);
  }

  const days = dayPoisLists.map((dayPois, i) =>
    buildDayPlan(dayPois, i, pace, dayStartMinutes, customDurations, meals),
  );
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
