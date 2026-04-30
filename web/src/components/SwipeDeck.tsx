"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { type Category, type Poi } from "@/lib/poi";
import { CategoryPicker } from "./CategoryPicker";
import { SwipeCard } from "./SwipeCard";

const LIKES_KEY = "triplanner.likes";
const PASSES_KEY = "triplanner.passes";
const SUBCATS_KEY = "triplanner.subcategories";
// Legacy key — used for migration only.
const LEGACY_CATEGORIES_KEY = "triplanner.categories";

// Weighted shuffle (Efraimidis-Spirakis): items with higher score tend to come
// first, but the order is still randomized — popular spots appear early without
// being deterministic.
function weightedShuffle(pois: Poi[]): Poi[] {
  return pois
    .map((poi) => ({
      poi,
      key: -Math.log(Math.random()) / Math.max(poi.score, 0.05),
    }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.poi);
}

function readStringSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? new Set(arr.filter((x): x is string => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

type LastSwipe = { poiId: string; direction: "like" | "pass" } | null;

export function SwipeDeck({ pois }: { pois: Poi[] }) {
  const [hydrated, setHydrated] = useState(false);
  const [picking, setPicking] = useState(false);
  const [selectedSubcats, setSelectedSubcats] = useState<Set<string>>(new Set());
  const [deck, setDeck] = useState<Poi[]>([]);
  const [index, setIndex] = useState(0);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [passes, setPasses] = useState<Set<string>>(new Set());
  const [lastSwipe, setLastSwipe] = useState<LastSwipe>(null);

  // Subcategories per main category, derived from the dataset.
  const subcatsByCat = useMemo(() => {
    const out = {} as Record<Category, string[]>;
    const seen = new Set<string>();
    for (const p of pois) {
      const key = `${p.category}::${p.subcategory}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!out[p.category]) out[p.category] = [];
      out[p.category].push(p.subcategory);
    }
    return out;
  }, [pois]);

  // POI count per subcategory.
  const countBySubcat = useMemo(() => {
    const out: Record<string, number> = {};
    for (const p of pois) out[p.subcategory] = (out[p.subcategory] ?? 0) + 1;
    return out;
  }, [pois]);

  // Hydration: load persisted state, migrate legacy categories key if needed.
  useEffect(() => {
    const savedLikes = readStringSet(LIKES_KEY);
    const savedPasses = readStringSet(PASSES_KEY);
    setLikes(savedLikes);
    setPasses(savedPasses);

    let savedSubcats = readStringSet(SUBCATS_KEY);

    if (savedSubcats.size === 0) {
      // Migrate from old "triplanner.categories" — map each category to all of
      // its subcategories so the user keeps the same de-facto filter.
      const legacy = readStringSet(LEGACY_CATEGORIES_KEY) as Set<Category>;
      if (legacy.size > 0) {
        const migrated = new Set<string>();
        for (const cat of legacy) {
          for (const sub of subcatsByCat[cat] ?? []) migrated.add(sub);
        }
        savedSubcats = migrated;
        writeSet(SUBCATS_KEY, savedSubcats);
        localStorage.removeItem(LEGACY_CATEGORIES_KEY);
      }
    }

    setSelectedSubcats(savedSubcats);

    if (savedSubcats.size === 0) {
      setPicking(true);
    } else {
      const seen = new Set([...savedLikes, ...savedPasses]);
      const remaining = pois.filter(
        (p) => savedSubcats.has(p.subcategory) && !seen.has(p.id),
      );
      setDeck(weightedShuffle(remaining));
      setIndex(0);
    }

    setHydrated(true);
  }, [pois, subcatsByCat]);

  function handleConfirmSubcats(selected: Set<string>) {
    setSelectedSubcats(selected);
    writeSet(SUBCATS_KEY, selected);
    setPicking(false);
    setLastSwipe(null);
    const seen = new Set([...likes, ...passes]);
    const remaining = pois.filter(
      (p) => selected.has(p.subcategory) && !seen.has(p.id),
    );
    setDeck(weightedShuffle(remaining));
    setIndex(0);
  }

  function handleSwipe(direction: "like" | "pass") {
    const current = deck[index];
    if (!current) return;

    if (direction === "like") {
      const next = new Set(likes);
      next.add(current.id);
      setLikes(next);
      writeSet(LIKES_KEY, next);
    } else {
      const next = new Set(passes);
      next.add(current.id);
      setPasses(next);
      writeSet(PASSES_KEY, next);
    }

    setLastSwipe({ poiId: current.id, direction });
    setIndex((i) => i + 1);
  }

  function handleUndo() {
    if (!lastSwipe) return;
    const { poiId, direction } = lastSwipe;

    if (direction === "like") {
      const next = new Set(likes);
      next.delete(poiId);
      setLikes(next);
      writeSet(LIKES_KEY, next);
    } else {
      const next = new Set(passes);
      next.delete(poiId);
      setPasses(next);
      writeSet(PASSES_KEY, next);
    }

    setIndex((i) => Math.max(0, i - 1));
    setLastSwipe(null);
  }

  function handleReset() {
    localStorage.removeItem(LIKES_KEY);
    localStorage.removeItem(PASSES_KEY);
    setLikes(new Set());
    setPasses(new Set());
    setLastSwipe(null);
    const remaining = pois.filter((p) => selectedSubcats.has(p.subcategory));
    setDeck(weightedShuffle(remaining));
    setIndex(0);
  }

  if (!hydrated) {
    return <DeckSkeleton />;
  }

  if (picking) {
    return (
      <CategoryPicker
        initial={selectedSubcats}
        subcatsByCat={subcatsByCat}
        countBySubcat={countBySubcat}
        onConfirm={handleConfirmSubcats}
      />
    );
  }

  const remaining = deck.length - index;
  const current = deck[index];
  const next = deck[index + 1];

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-br from-sky-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="flex items-center justify-between gap-2 px-4 py-3">
        <Link
          href="/"
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          ← Retour
        </Link>

        <div className="flex flex-col items-center text-xs">
          <div className="font-medium text-slate-600 dark:text-slate-400">
            {likes.size} aimés · {remaining} restants
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastSwipe && (
            <button
              type="button"
              onClick={handleUndo}
              className="rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Annuler le dernier swipe"
              title="Annuler le dernier swipe"
            >
              ↶
            </button>
          )}
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label="Modifier les préférences"
            title="Modifier les préférences"
          >
            ⚙
          </button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-4">
        {current ? (
          <div className="relative h-[min(75vh,680px)] w-full max-w-md">
            {next && <SwipeCard key={`next-${next.id}`} poi={next} isTop={false} />}
            <SwipeCard
              key={`top-${current.id}`}
              poi={current}
              isTop
              onSwipe={handleSwipe}
            />
          </div>
        ) : (
          <EmptyState
            likeCount={likes.size}
            totalCount={deck.length}
            onReset={handleReset}
            onChangePreferences={() => setPicking(true)}
          />
        )}
      </div>

      {current && (
        <footer className="flex justify-center gap-6 px-4 pb-8">
          <button
            type="button"
            onClick={() => handleSwipe("pass")}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl text-red-500 shadow-lg transition hover:scale-105 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950"
            aria-label="Passer"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={() => handleSwipe("like")}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl text-emerald-500 shadow-lg transition hover:scale-105 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950"
            aria-label="Aimer"
          >
            ♥
          </button>
        </footer>
      )}
    </div>
  );
}

function DeckSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
      Chargement…
    </div>
  );
}

function EmptyState({
  likeCount,
  totalCount,
  onReset,
  onChangePreferences,
}: {
  likeCount: number;
  totalCount: number;
  onReset: () => void;
  onChangePreferences: () => void;
}) {
  return (
    <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-800">
      <div className="text-5xl">🎉</div>
      <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
        Tu as tout vu&nbsp;!
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {likeCount} lieu{likeCount > 1 ? "x" : ""} aimé{likeCount > 1 ? "s" : ""} sur {totalCount}.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-full bg-sky-600 px-6 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Recommencer
        </button>
        <button
          type="button"
          onClick={onChangePreferences}
          className="rounded-full bg-slate-100 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          Changer mes préférences
        </button>
      </div>
    </div>
  );
}
