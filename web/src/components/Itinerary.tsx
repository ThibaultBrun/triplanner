"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { CATEGORY_LABELS, type Category, type Poi } from "@/lib/poi";
import {
  buildItinerary,
  dayLabel,
  formatDuration,
  formatTime,
  isOverDayEnd,
  type DayItem,
} from "@/lib/itinerary";

const LIKES_KEY = "triplanner.likes";

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

export function Itinerary({ pois }: { pois: Poi[] }) {
  const [hydrated, setHydrated] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [numDays, setNumDays] = useState(3);

  useEffect(() => {
    setLikedIds(readLikedIds());
    setHydrated(true);
  }, []);

  const likedPois = useMemo(
    () => pois.filter((p) => likedIds.has(p.id)),
    [pois, likedIds],
  );

  const itinerary = useMemo(
    () => buildItinerary(likedPois, numDays),
    [likedPois, numDays],
  );

  if (!hydrated) {
    return <Skeleton />;
  }

  if (likedPois.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-full w-full bg-gradient-to-br from-sky-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
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
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <div className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          {likedPois.length} lieu{likedPois.length > 1 ? "x" : ""} aimé
          {likedPois.length > 1 ? "s" : ""}, répartis sur {numDays} jour
          {numDays > 1 ? "s" : ""}.
        </div>

        <div className="space-y-8">
          {itinerary.days.map((day) => (
            <DaySection key={day.index} index={day.index} items={day.items} />
          ))}
        </div>
      </main>
    </div>
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

function DaySection({ index, items }: { index: number; items: DayItem[] }) {
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

  return (
    <section>
      <DayHeader index={index} count={items.length} />
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-500">
        {formatDuration(totalVisitMin)} de visites · {formatDuration(totalTravelMin)} de trajet
      </div>

      <ol className="mt-4 space-y-2">
        {items.map((item, i) => (
          <li key={`${item.poi.id}-${i}`}>
            <ItineraryItem item={item} />
            {item.travelToNextMinutes > 0 && (
              <TravelHint km={item.travelToNextKm} minutes={item.travelToNextMinutes} />
            )}
          </li>
        ))}
      </ol>
    </section>
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

function ItineraryItem({ item }: { item: DayItem }) {
  const { poi } = item;
  const overflow = isOverDayEnd(item);

  return (
    <div
      className={`flex gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800 ${
        overflow ? "ring-2 ring-amber-400" : ""
      }`}
    >
      {poi.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poi.image}
          alt=""
          className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
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
      </div>

      <div className="flex flex-col items-end justify-between text-right text-xs">
        <div className="font-mono font-semibold text-slate-700 dark:text-slate-300">
          {formatTime(item.startMinutes)}
        </div>
        <div className="text-slate-400">
          {formatDuration(item.endMinutes - item.startMinutes)}
        </div>
        {overflow && (
          <div className="text-amber-600">⚠ après 18h</div>
        )}
      </div>
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
