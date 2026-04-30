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
  initial: Set<string>;
  subcatsByCat: Record<Category, string[]>;
  countBySubcat: Record<string, number>;
  onConfirm: (selectedSubcats: Set<string>) => void;
  showBackToHome?: boolean;
};

type CatState = "all" | "some" | "none";

function catState(cat: Category, subs: string[], selected: Set<string>): CatState {
  if (subs.length === 0) return "none";
  const selCount = subs.filter((s) => selected.has(s)).length;
  if (selCount === 0) return "none";
  if (selCount === subs.length) return "all";
  return "some";
}

export function CategoryPicker({
  initial,
  subcatsByCat,
  countBySubcat,
  onConfirm,
  showBackToHome = true,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial));
  const [expanded, setExpanded] = useState<Set<Category>>(new Set());

  function toggleSubcat(sub: string) {
    const next = new Set(selected);
    if (next.has(sub)) next.delete(sub);
    else next.add(sub);
    setSelected(next);
  }

  function toggleCategory(cat: Category) {
    const subs = subcatsByCat[cat] ?? [];
    const state = catState(cat, subs, selected);
    const next = new Set(selected);
    if (state === "all") {
      for (const s of subs) next.delete(s);
    } else {
      for (const s of subs) next.add(s);
    }
    setSelected(next);
  }

  function toggleExpanded(cat: Category) {
    const next = new Set(expanded);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpanded(next);
  }

  const allSubcats = ALL_CATEGORIES.flatMap((c) => subcatsByCat[c] ?? []);
  const allSelected = allSubcats.every((s) => selected.has(s));
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allSubcats));
  }

  const totalSelectedCount = [...selected].reduce(
    (acc, s) => acc + (countBySubcat[s] ?? 0),
    0,
  );

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

      <div className="flex flex-1 flex-col items-center justify-start px-4 py-8">
        <h1 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-50">
          Qu&apos;est-ce qui vous plaît&nbsp;?
        </h1>
        <p className="mt-2 max-w-md text-center text-sm text-slate-600 dark:text-slate-400">
          Cliquez sur une catégorie pour voir et choisir ses sous-types.
        </p>

        <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          {ALL_CATEGORIES.map((cat) => {
            const subs = subcatsByCat[cat] ?? [];
            const state = catState(cat, subs, selected);
            const isExpanded = expanded.has(cat);
            const totalCount = subs.reduce(
              (acc, s) => acc + (countBySubcat[s] ?? 0),
              0,
            );

            return (
              <div
                key={cat}
                className={`rounded-2xl bg-gradient-to-br ${CATEGORY_GRADIENTS[cat]} p-3 shadow-sm transition dark:from-slate-800 dark:to-slate-900 ${
                  state === "all"
                    ? `ring-4 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${CATEGORY_RING[cat]}`
                    : state === "some"
                    ? `ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ${CATEGORY_RING[cat]}`
                    : "ring-1 ring-inset ring-slate-200 dark:ring-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="flex flex-shrink-0 items-center gap-3 text-left"
                    aria-pressed={state !== "none"}
                  >
                    <div className="text-3xl">{CATEGORY_EMOJI[cat]}</div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {CATEGORY_LABELS[cat]}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {totalCount} lieu{totalCount > 1 ? "x" : ""}
                        {state === "some" && (
                          <span className="ml-1 text-slate-700 dark:text-slate-300">
                            · {subs.filter((s) => selected.has(s)).length}/{subs.length} types
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="ml-auto flex items-center gap-2">
                    {state === "all" && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-emerald-600 shadow dark:bg-slate-700">
                        ✓
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(cat)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-slate-600 hover:bg-white dark:bg-slate-700/70 dark:text-slate-300"
                      aria-label={isExpanded ? "Réduire" : "Déplier"}
                    >
                      <span className={`text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                        ▾
                      </span>
                    </button>
                  </div>
                </div>

                {isExpanded && subs.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-white/40 pt-3 dark:border-slate-700">
                    {subs
                      .slice()
                      .sort()
                      .map((sub) => {
                        const isSel = selected.has(sub);
                        const count = countBySubcat[sub] ?? 0;
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => toggleSubcat(sub)}
                            className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition ${
                              isSel
                                ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                                : "text-slate-600 hover:bg-white/60 dark:text-slate-400 dark:hover:bg-slate-800/60"
                            }`}
                            aria-pressed={isSel}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                                  isSel
                                    ? `border-transparent bg-emerald-500 text-white`
                                    : "border-slate-300 dark:border-slate-600"
                                }`}
                              >
                                {isSel && <span className="text-[10px] leading-none">✓</span>}
                              </span>
                              {sub}
                            </span>
                            <span className="text-xs text-slate-400">{count}</span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
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
            ? "Sélectionnez au moins une option"
            : `Commencer · ${totalSelectedCount} lieu${totalSelectedCount > 1 ? "x" : ""}`}
        </button>
      </footer>
    </div>
  );
}
