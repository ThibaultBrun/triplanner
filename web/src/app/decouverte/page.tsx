import { SwipeDeck } from "@/components/SwipeDeck";
import poisData from "@/data/pois.json";
import type { Poi } from "@/lib/poi";

const allPois = poisData as Poi[];
// Only POI with an image — better swipe UX with photos.
const photoPois = allPois.filter((p) => Boolean(p.image));

export const metadata = {
  title: "Découverte — Tri'planner",
};

export default function DecouvertePage() {
  return (
    <div className="fixed inset-0">
      <SwipeDeck pois={photoPois} />
    </div>
  );
}
