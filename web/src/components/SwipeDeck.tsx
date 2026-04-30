"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { Poi } from "@/lib/poi";
import { SwipeCard } from "./SwipeCard";

const LIKES_KEY = "triplanner.likes";
const PASSES_KEY = "triplanner.passes";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function readSet(key: string): Set<string> {
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

export function SwipeDeck({ pois }: { pois: Poi[] }) {
  const [deck, setDeck] = useState<Poi[]>([]);
  const [index, setIndex] = useState(0);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [passes, setPasses] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedLikes = readSet(LIKES_KEY);
    const savedPasses = readSet(PASSES_KEY);
    setLikes(savedLikes);
    setPasses(savedPasses);

    const seen = new Set([...savedLikes, ...savedPasses]);
    const remaining = pois.filter((p) => !seen.has(p.id));
    setDeck(shuffle(remaining));
    setIndex(0);
    setHydrated(true);
  }, [pois]);

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

    setIndex((i) => i + 1);
  }

  function handleReset() {
    localStorage.removeItem(LIKES_KEY);
    localStorage.removeItem(PASSES_KEY);
    setLikes(new Set());
    setPasses(new Set());
    setDeck(shuffle(pois));
    setIndex(0);
  }

  if (!hydrated) {
    return <DeckSkeleton />;
  }

  const remaining = deck.length - index;
  const current = deck[index];
  const next = deck[index + 1];

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-br from-sky-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="flex items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          ← Retour
        </Link>
        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {likes.size} aimés · {remaining} restants
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-4">
        {current ? (
          <div className="relative h-[min(70vh,640px)] w-full max-w-md">
            {next && <SwipeCard key={`next-${next.id}`} poi={next} isTop={false} />}
            <SwipeCard
              key={`top-${current.id}`}
              poi={current}
              isTop
              onSwipe={handleSwipe}
            />
          </div>
        ) : (
          <EmptyState likeCount={likes.size} totalCount={pois.length} onReset={handleReset} />
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
}: {
  likeCount: number;
  totalCount: number;
  onReset: () => void;
}) {
  return (
    <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-800">
      <div className="text-5xl">🎉</div>
      <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
        Tu as tout vu !
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {likeCount} lieu{likeCount > 1 ? "x" : ""} aimé{likeCount > 1 ? "s" : ""} sur {totalCount}.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-full bg-sky-600 px-6 py-2 text-sm font-medium text-white hover:bg-sky-700"
      >
        Recommencer
      </button>
    </div>
  );
}
