"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";

import { type Poi } from "@/lib/poi";

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 500;

type Props = {
  poi: Poi;
  isTop: boolean;
  onSwipe?: (direction: "like" | "pass") => void;
};

export function SwipeCard({ poi, isTop, onSwipe }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeTint = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.55]);
  const passTint = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.55, 0]);
  const likeIcon = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  const passIcon = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
      onSwipe?.("like");
    } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) {
      onSwipe?.("pass");
    }
  }

  if (!isTop) {
    return (
      <div
        className="absolute inset-0 scale-[0.94] opacity-70 pointer-events-none"
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
        {/* Green tint for like */}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-emerald-500"
          style={{ opacity: likeTint }}
        />
        {/* Red tint for pass */}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-red-500"
          style={{ opacity: passTint }}
        />
        {/* Big like heart */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-white"
          style={{ opacity: likeIcon }}
        >
          <span className="text-9xl drop-shadow-2xl">♥</span>
        </motion.div>
        {/* Big pass cross */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-white"
          style={{ opacity: passIcon }}
        >
          <span className="text-9xl drop-shadow-2xl">✕</span>
        </motion.div>
      </CardSurface>
    </motion.div>
  );
}

function CardSurface({ poi, children }: { poi: Poi; children?: React.ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-slate-200 shadow-2xl">
      {poi.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poi.image}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}

      {/* Bottom gradient + content */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-6 pb-6 pt-24 text-white">
        {poi.city && (
          <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-white/90">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.215.783ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                clipRule="evenodd"
              />
            </svg>
            {poi.city}
          </div>
        )}

        <h2 className="text-3xl font-bold leading-tight tracking-tight">
          {poi.name}
        </h2>

        <div className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wider backdrop-blur-sm">
          {poi.subcategory}
        </div>

        {poi.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/85">
            {poi.description}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
