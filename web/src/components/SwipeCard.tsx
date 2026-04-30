"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";

import { CATEGORY_LABELS, type Category, type Poi } from "@/lib/poi";

const CATEGORY_BADGE: Record<Category, string> = {
  patrimoine: "bg-amber-100 text-amber-900",
  musees: "bg-violet-100 text-violet-900",
  nature: "bg-emerald-100 text-emerald-900",
  sport: "bg-orange-100 text-orange-900",
  gastronomie: "bg-red-100 text-red-900",
  loisirs: "bg-sky-100 text-sky-900",
  "bien-etre": "bg-pink-100 text-pink-900",
  "vie-nocturne": "bg-indigo-100 text-indigo-900",
};

const SWIPE_THRESHOLD = 120;

type Props = {
  poi: Poi;
  isTop: boolean;
  onSwipe?: (direction: "like" | "pass") => void;
};

export function SwipeCard({ poi, isTop, onSwipe }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) onSwipe?.("like");
    else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe?.("pass");
  }

  if (!isTop) {
    return (
      <div
        className="absolute inset-0 scale-95 opacity-60 pointer-events-none"
        aria-hidden
      >
        <CardSurface poi={poi} />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.99 }}
    >
      <CardSurface poi={poi}>
        <motion.div
          className="absolute top-6 left-6 rounded-lg border-4 border-emerald-500 px-3 py-1 text-xl font-bold text-emerald-500 -rotate-12"
          style={{ opacity: likeOpacity }}
        >
          AIMÉ
        </motion.div>
        <motion.div
          className="absolute top-6 right-6 rounded-lg border-4 border-red-500 px-3 py-1 text-xl font-bold text-red-500 rotate-12"
          style={{ opacity: passOpacity }}
        >
          PASSE
        </motion.div>
      </CardSurface>
    </motion.div>
  );
}

function CardSurface({ poi, children }: { poi: Poi; children?: React.ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-200 shadow-xl">
      {poi.image && (
        // Static export → no next/image optimization. Use plain <img>.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poi.image}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 pt-20 text-white">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_BADGE[poi.category]}`}>
            {CATEGORY_LABELS[poi.category]}
          </span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
            {poi.subcategory}
          </span>
        </div>

        <h2 className="mt-3 text-2xl font-semibold leading-tight">{poi.name}</h2>

        {poi.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/90">
            {poi.description}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
