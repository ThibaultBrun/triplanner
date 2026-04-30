"use client";

import { useState } from "react";
import Link from "next/link";

import { CATEGORY_LABELS, type Category } from "@/lib/poi";

const CATEGORY_EMOJI: Record<Category, string> = {
  patrimoine: "🏰",
  musees: "🎨",
  nature: "🌲",
  sport: "🏃",
  gastronomie: "🍽️",
  loisirs: "🎢",
  "bien-etre": "🧘",
  "vie-nocturne": "🍷",
};

const CATEGORY_GRADIENTS: Record<Category, string> = {
  patrimoine: "from-amber-200 to-amber-50",
  musees: "from-violet-200 to-violet-50",
  nature: "from-emerald-200 to-emerald-50",
  sport: "from-orange-200 to-orange-50",
  gastronomie: "from-red-200 to-red-50",
  loisirs: "from-sky-200 to-sky-50",
  "bien-etre": "from-pink-200 to-pink-50",
  "vie-nocturne": "from-indigo-200 to-indigo-50",
};

const CATEGORY_RING: Record<Category, string> = {
  patrimoine: "ring-amber-500",
  musees: "ring-violet-500",
  nature: "ring-emerald-500",
  sport: "ring-orange-500",
  gastronomie: "ring-red-500",
  loisirs: "ring-sky-500",
  "bien-etre": "ring-pink-500",
  "vie-nocturne": "ring-indigo-500",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

type Props = {
  initial: Set<Category>;
  countByCategory: Record<Category, number>;
  onConfirm: (selected: Set<Category>) => void;
  showBackToHome?: boolean;
};

export function CategoryPicker({ initial, countByCategory, onConfirm, showBackToHome = true }: Props) {
  const [selected, setSelected] = useState<Set<Category>>(new Set(initial));

  function toggle(cat: Category) {
    const next = new Set(selected);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setSelected(next);
  }

  const allSelected = selected.size === ALL_CATEGORIES.length;
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(ALL_CATEGORIES));
  }

  const totalSelectedCount = ALL_CATEGORIES
    .filter((c) => selected.has(c))
    .reduce((acc, c) => acc + (countByCategory[c] ?? 0), 0);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-gradient-to-br from-sky-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {showBackToHome && (
        <header className="flex items-center justify-between px-4 pt-4">
          <Link
            href="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200"
          >
            ← Retour
          </Link>
          <button
            type="button"
            onClick={toggleAll}
            className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white dark:bg-slate-800/80 dark:text-slate-300"
          >
            {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
        </header>
      )}

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <h1 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-50">
          Qu&apos;est-ce qui vous plaît&nbsp;?
        </h1>
        <p className="mt-2 max-w-md text-center text-sm text-slate-600 dark:text-slate-400">
          Choisissez les catégories qui vous intéressent. Vous pourrez les modifier plus tard.
        </p>

        <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selected.has(cat);
            const count = countByCategory[cat] ?? 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggle(cat)}
                aria-pressed={isSelected}
                className={`group relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${CATEGORY_GRADIENTS[cat]} p-4 text-center shadow-sm transition active:scale-95 dark:from-slate-800 dark:to-slate-900 ${
                  isSelected
                    ? `ring-4 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${CATEGORY_RING[cat]}`
                    : "ring-1 ring-inset ring-slate-200 hover:ring-slate-300 dark:ring-slate-700"
                }`}
              >
                <div className="text-4xl sm:text-5xl">{CATEGORY_EMOJI[cat]}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {CATEGORY_LABELS[cat]}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {count} lieu{count > 1 ? "x" : ""}
                </div>
                {isSelected && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-emerald-600 shadow dark:bg-slate-700">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <footer className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={() => onConfirm(selected)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700"
        >
          {selected.size === 0
            ? "Sélectionnez au moins une catégorie"
            : `Commencer · ${totalSelectedCount} lieu${totalSelectedCount > 1 ? "x" : ""}`}
        </button>
      </footer>
    </div>
  );
}
