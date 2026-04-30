import Link from "next/link";

import { Map } from "@/components/Map";
import poisData from "@/data/pois.json";
import { CATEGORY_LABELS, type Category, type Poi } from "@/lib/poi";

const pois = poisData as Poi[];

const CATEGORY_DOT_COLORS: Record<Category, string> = {
  patrimoine: "bg-amber-800",
  musees: "bg-violet-600",
  nature: "bg-emerald-600",
  sport: "bg-orange-600",
  gastronomie: "bg-red-600",
  loisirs: "bg-sky-500",
  "bien-etre": "bg-pink-400",
  "vie-nocturne": "bg-indigo-700",
};

export const metadata = {
  title: "Carte — Tri'planner",
};

export default function CartePage() {
  // Only show legend entries for categories actually present in the dataset.
  const presentCats = new Set(pois.map((p) => p.category));

  return (
    <div className="fixed inset-0">
      <Map pois={pois} />

      <Link
        href="/"
        className="absolute top-4 left-4 z-10 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-md backdrop-blur-sm hover:bg-white"
      >
        ← Retour
      </Link>

      <div className="absolute bottom-6 left-4 z-10 max-w-xs rounded-xl bg-white/95 p-4 shadow-md backdrop-blur-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {pois.length} lieux · Pays Basque
        </div>
        <ul className="space-y-1 text-sm text-slate-700">
          {(Object.entries(CATEGORY_LABELS) as [Category, string][])
            .filter(([cat]) => presentCats.has(cat))
            .map(([cat, label]) => (
              <li key={cat} className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${CATEGORY_DOT_COLORS[cat]} ring-2 ring-white`}
                />
                <span>{label}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
