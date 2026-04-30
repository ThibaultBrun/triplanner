"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Reorder, useDragControls } from "motion/react";

import { CATEGORY_LABELS, type Category, type Poi } from "@/lib/poi";
import {
  buildItinerary,
  dayLabel,
  DEFAULT_DAY_START_MIN,
  DURATION_OPTIONS_MIN,
  formatDuration,
  formatTime,
  isOverDayEnd,
  PACE_LABELS,
  type DayItem,
  type Itinerary as ItineraryType,
  type Pace,
} from "@/lib/itinerary";
import { ItineraryMap } from "./ItineraryMap";

const LIKES_KEY = "triplanner.likes";
const PACE_KEY = "triplanner.pace";

const ALL_PACES: Pace[] = ["express", "standard", "tranquille"];

type View = "list" | "map";

const CATEGORY_DOT_COLORS: Record<Category, string> = {
  patrimoine: "bg-amber-700",
  musees: "bg-violet-600",
  nature: "bg-emerald-600",
  sport: "bg-orange-600",
  gastronomie: "bg-red-600",
  loisirs: "bg-sky-500",
  "bien-etre": "bg-pink-400",
  "vie-nocturne": "bg-indigo-700",
};

function readLikedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? new Set(arr.filter((x): x is string => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

// Snapshot the current itinerary as a per-day list of POI ids.
function snapshot(itinerary: ItineraryType): Record<number, string[]> {
  const out: Record<number, string[]> = {};
  for (const day of itinerary.days) {
    out[day.index] = day.items.map((it) => it.poi.id);
  }
  return out;
}

export function Itinerary({ pois }: { pois: Poi[] }) {
  const [hydrated, setHydrated] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [numDays, setNumDays] = useState(3);
  const [pace, setPace] = useState<Pace>("standard");
  const [view, setView] = useState<View>("list");
  const [startMinutes, setStartMinutes] = useState(DEFAULT_DAY_START_MIN);
  // null = use auto-assignment; otherwise use this exact per-day mapping.
  const [customDays, setCustomDays] = useState<Record<number, string[]> | null>(null);
  // poi id → custom visit duration (in minutes), overrides pace-based.
  const [customDurations, setCustomDurations] = useState<Record<string, number>>({});

  useEffect(() => {
    setLikedIds(readLikedIds());
    const savedPace = localStorage.getItem(PACE_KEY);
    if (savedPace === "express" || savedPace === "standard" || savedPace === "tranquille") {
      setPace(savedPace);
    }
    setHydrated(true);
  }, []);

  // Structural changes (numDays / pace) reset all manual overrides.
  useEffect(() => {
    setCustomDays(null);
  }, [numDays, pace]);

  function handlePaceChange(p: Pace) {
    setPace(p);
    localStorage.setItem(PACE_KEY, p);
  }

  const likedPois = useMemo(
    () => pois.filter((p) => likedIds.has(p.id)),
    [pois, likedIds],
  );

  const itinerary = useMemo(
    () =>
      buildItinerary(likedPois, numDays, pace, {
        customDays: customDays ?? undefined,
        customDurations,
        dayStartMinutes: startMinutes,
      }),
    [likedPois, numDays, pace, customDays, customDurations, startMinutes],
  );

  // Helper that snapshots the current itinerary if customDays isn't already set,
  // then applies a transformation. This way, the first manual edit "freezes"
  // the auto-proposition and subsequent edits build on top of it.
  function withSnapshot(
    transform: (days: Record<number, string[]>) => Record<number, string[]>,
  ) {
    setCustomDays((prev) => transform(prev ?? snapshot(itinerary)));
  }

  function handleReorderDay(dayIndex: number, newIds: string[]) {
    withSnapshot((days) => ({ ...days, [dayIndex]: newIds }));
  }

  function handleMoveToDay(poiId: string, fromDay: number, toDay: number) {
    if (fromDay === toDay) return;
    withSnapshot((days) => {
      const out = { ...days };
      out[fromDay] = (out[fromDay] ?? []).filter((id) => id !== poiId);
      out[toDay] = [...(out[toDay] ?? []), poiId];
      return out;
    });
  }

  function handleChangeDuration(poiId: string, minutes: number) {
    setCustomDurations((prev) => ({ ...prev, [poiId]: minutes }));
  }

  function handleRemove(poiId: string) {
    const next = new Set(likedIds);
    next.delete(poiId);
    setLikedIds(next);
    localStorage.setItem(LIKES_KEY, JSON.stringify([...next]));

    setCustomDurations((prev) => {
      if (!(poiId in prev)) return prev;
      const out = { ...prev };
      delete out[poiId];
      return out;
    });
    setCustomDays((prev) => {
      if (!prev) return prev;
      const out: Record<number, string[]> = {};
      for (const [k, ids] of Object.entries(prev)) {
        out[Number(k)] = ids.filter((id) => id !== poiId);
      }
      return out;
    });
  }

  if (!hydrated) {
    return <Skeleton />;
  }

  if (likedPois.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-1 w-full flex-col bg-gradient-to-br from-sky-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200"
          >
            ← Retour
          </Link>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-50 sm:text-lg">
            Mon itinéraire
          </h1>
          <DayCountStepper value={numDays} onChange={setNumDays} />
        </div>
        <div className="mx-auto mt-3 flex max-w-3xl flex-wrap items-center gap-2">
          <PacePicker value={pace} onChange={handlePaceChange} />
          <StartTimeInput value={startMinutes} onChange={setStartMinutes} />
          <ViewToggle value={view} onChange={setView} />
        </div>
      </header>

      {view === "list" ? (
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 pb-24 pt-6">
            <div className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              {likedPois.length} lieu{likedPois.length > 1 ? "x" : ""} aimé
              {likedPois.length > 1 ? "s" : ""}, répartis sur {numDays} jour
              {numDays > 1 ? "s" : ""} · rythme {PACE_LABELS[pace].toLowerCase()} · départ à {formatTime(startMinutes)}.
            </div>

            <div className="space-y-8">
              {itinerary.days.map((day) => (
                <DaySection
                  key={day.index}
                  index={day.index}
                  numDays={numDays}
                  items={day.items}
                  customDurations={customDurations}
                  onReorder={(ids) => handleReorderDay(day.index, ids)}
                  onMoveToDay={(poiId, toDay) => handleMoveToDay(poiId, day.index, toDay)}
                  onChangeDuration={handleChangeDuration}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </div>
        </main>
      ) : (
        <div className="relative flex-1">
          <ItineraryMap itinerary={itinerary} />
        </div>
      )}
    </div>
  );
}

function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  return (
    <div className="ml-auto flex gap-1 rounded-full bg-slate-100 p-1 text-sm dark:bg-slate-800">
      {(["list", "map"] as View[]).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-full px-3 py-1.5 font-medium transition ${
            value === v
              ? "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-slate-50"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {v === "list" ? "📋 Liste" : "🗺 Carte"}
        </button>
      ))}
    </div>
  );
}

function PacePicker({
  value,
  onChange,
}: {
  value: Pace;
  onChange: (p: Pace) => void;
}) {
  return (
    <div className="flex gap-1 rounded-full bg-slate-100 p-1 text-sm dark:bg-slate-800">
      {ALL_PACES.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded-full px-3 py-1.5 font-medium transition ${
            value === p
              ? "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-slate-50"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {PACE_LABELS[p]}
        </button>
      ))}
    </div>
  );
}

function StartTimeInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (minutes: number) => void;
}) {
  const hh = String(Math.floor(value / 60)).padStart(2, "0");
  const mm = String(value % 60).padStart(2, "0");
  return (
    <label className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm shadow dark:bg-slate-800">
      <span className="text-slate-500 dark:text-slate-400">Départ</span>
      <input
        type="time"
        step={900}
        value={`${hh}:${mm}`}
        onChange={(e) => {
          const [h, m] = e.target.value.split(":").map(Number);
          if (Number.isFinite(h) && Number.isFinite(m)) {
            onChange(h * 60 + m);
          }
        }}
        className="bg-transparent font-mono font-medium text-slate-900 focus:outline-none dark:text-slate-100"
      />
    </label>
  );
}

function DayCountStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1 shadow dark:bg-slate-800">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700"
        aria-label="Diminuer le nombre de jours"
      >
        −
      </button>
      <span className="min-w-[3rem] text-center text-sm font-medium text-slate-900 dark:text-slate-100">
        {value} jour{value > 1 ? "s" : ""}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(14, value + 1))}
        disabled={value >= 14}
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700"
        aria-label="Augmenter le nombre de jours"
      >
        +
      </button>
    </div>
  );
}

function DaySection({
  index,
  numDays,
  items,
  customDurations,
  onReorder,
  onMoveToDay,
  onChangeDuration,
  onRemove,
}: {
  index: number;
  numDays: number;
  items: DayItem[];
  customDurations: Record<string, number>;
  onReorder: (newIds: string[]) => void;
  onMoveToDay: (poiId: string, toDay: number) => void;
  onChangeDuration: (poiId: string, minutes: number) => void;
  onRemove: (poiId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <section>
        <DayHeader index={index} count={0} />
        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40">
          Aucune visite prévue ce jour.
        </div>
      </section>
    );
  }

  const totalVisitMin = items.reduce(
    (s, it) => s + (it.endMinutes - it.startMinutes),
    0,
  );
  const totalTravelMin = items.reduce((s, it) => s + it.travelToNextMinutes, 0);
  const ids = items.map((it) => it.poi.id);

  return (
    <section>
      <DayHeader index={index} count={items.length} />
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-500">
        {formatDuration(totalVisitMin)} de visites · {formatDuration(totalTravelMin)} de trajet
      </div>

      <Reorder.Group
        as="ol"
        axis="y"
        values={ids}
        onReorder={onReorder}
        className="mt-4 space-y-2"
      >
        {items.map((item) => (
          <DraggableItem
            key={item.poi.id}
            item={item}
            currentDayIndex={index}
            numDays={numDays}
            isCustomDuration={item.poi.id in customDurations}
            onMoveToDay={onMoveToDay}
            onChangeDuration={onChangeDuration}
            onRemove={onRemove}
          />
        ))}
      </Reorder.Group>
    </section>
  );
}

function DraggableItem({
  item,
  currentDayIndex,
  numDays,
  isCustomDuration,
  onMoveToDay,
  onChangeDuration,
  onRemove,
}: {
  item: DayItem;
  currentDayIndex: number;
  numDays: number;
  isCustomDuration: boolean;
  onMoveToDay: (poiId: string, toDay: number) => void;
  onChangeDuration: (poiId: string, minutes: number) => void;
  onRemove: (poiId: string) => void;
}) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={item.poi.id}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{ scale: 1.02, boxShadow: "0 12px 24px rgba(0,0,0,0.18)" }}
      className="list-none"
    >
      <ItineraryItem
        item={item}
        currentDayIndex={currentDayIndex}
        numDays={numDays}
        isCustomDuration={isCustomDuration}
        onPointerDownDragHandle={(e) => dragControls.start(e)}
        onMoveToDay={(toDay) => onMoveToDay(item.poi.id, toDay)}
        onChangeDuration={(min) => onChangeDuration(item.poi.id, min)}
        onRemove={() => onRemove(item.poi.id)}
      />
      {item.travelToNextMinutes > 0 && (
        <TravelHint km={item.travelToNextKm} minutes={item.travelToNextMinutes} />
      )}
    </Reorder.Item>
  );
}

function DayHeader({ index, count }: { index: number; count: number }) {
  return (
    <h2 className="flex items-baseline gap-2 text-xl font-bold text-slate-900 dark:text-slate-50">
      {dayLabel(index)}
      <span className="text-sm font-medium text-slate-400">
        · {count} étape{count > 1 ? "s" : ""}
      </span>
    </h2>
  );
}

function ItineraryItem({
  item,
  currentDayIndex,
  numDays,
  isCustomDuration,
  onPointerDownDragHandle,
  onMoveToDay,
  onChangeDuration,
  onRemove,
}: {
  item: DayItem;
  currentDayIndex: number;
  numDays: number;
  isCustomDuration: boolean;
  onPointerDownDragHandle?: (e: React.PointerEvent) => void;
  onMoveToDay?: (toDay: number) => void;
  onChangeDuration?: (minutes: number) => void;
  onRemove?: () => void;
}) {
  const { poi } = item;
  const overflow = isOverDayEnd(item);
  const visitDuration = item.endMinutes - item.startMinutes;

  const otherDays = Array.from({ length: numDays }, (_, i) => i).filter(
    (i) => i !== currentDayIndex,
  );

  return (
    <div
      className={`flex items-stretch gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800 ${
        overflow ? "ring-2 ring-amber-400" : ""
      }`}
    >
      {onPointerDownDragHandle && (
        <button
          type="button"
          onPointerDown={onPointerDownDragHandle}
          aria-label="Réorganiser"
          className="flex w-5 flex-shrink-0 cursor-grab touch-none items-center justify-center text-slate-400 hover:text-slate-700 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-200"
        >
          <span className="text-lg leading-none select-none">⋮⋮</span>
        </button>
      )}

      {poi.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poi.image}
          alt=""
          className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl text-slate-300 dark:bg-slate-700">
          ◌
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className={`inline-block h-2 w-2 rounded-full ${CATEGORY_DOT_COLORS[poi.category]}`} />
          {CATEGORY_LABELS[poi.category]}
        </div>

        <div className="mt-0.5 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
          {poi.name}
        </div>

        {poi.city && (
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
            📍 {poi.city}
          </div>
        )}

        {/* Move-to-day select */}
        {onMoveToDay && otherDays.length > 0 && (
          <div className="mt-1.5">
            <select
              className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-300"
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (v !== "") {
                  onMoveToDay(Number(v));
                }
                e.target.value = "";
              }}
              aria-label="Déplacer vers un autre jour"
            >
              <option value="">Déplacer vers…</option>
              {otherDays.map((d) => (
                <option key={d} value={d}>
                  Jour {d + 1}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end justify-between gap-1 text-right text-xs">
        <div className="font-mono font-semibold text-slate-700 dark:text-slate-300">
          {formatTime(item.startMinutes)}
        </div>

        {onChangeDuration ? (
          <select
            className={`rounded-md border bg-transparent px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
              isCustomDuration
                ? "border-sky-400 text-sky-600 dark:border-sky-500 dark:text-sky-400"
                : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
            }`}
            value={visitDuration}
            onChange={(e) => onChangeDuration(Number(e.target.value))}
            aria-label="Durée de la visite"
          >
            {/* Make sure the current value is in the list. */}
            {!DURATION_OPTIONS_MIN.includes(visitDuration) && (
              <option value={visitDuration}>{formatDuration(visitDuration)}</option>
            )}
            {DURATION_OPTIONS_MIN.map((d) => (
              <option key={d} value={d}>
                {formatDuration(d)}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-slate-400">{formatDuration(visitDuration)}</div>
        )}

        {overflow && <div className="text-amber-600">⚠ après 18h</div>}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Retirer de l'itinéraire"
          title="Retirer de l'itinéraire"
          className="ml-1 flex h-7 w-7 flex-shrink-0 items-center justify-center self-start rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          <span className="text-base leading-none">✕</span>
        </button>
      )}
    </div>
  );
}

function TravelHint({ km, minutes }: { km: number; minutes: number }) {
  return (
    <div className="ml-6 my-1 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
      <span className="text-base leading-none">↓</span>
      <span>
        {km < 1 ? "<1" : km.toFixed(1)} km · {formatDuration(minutes)} de trajet
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
      Chargement…
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-amber-50 px-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-800">
        <div className="text-5xl">📍</div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
          Aucun lieu sélectionné
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Commencez par découvrir et aimer des lieux pour générer votre itinéraire.
        </p>
        <Link
          href="/decouverte"
          className="mt-6 inline-block rounded-full bg-sky-600 px-6 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Découvrir des lieux
        </Link>
      </div>
    </div>
  );
}
