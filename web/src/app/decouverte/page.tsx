import { SwipeDeck } from "@/components/SwipeDeck";
import poisData from "@/data/pois.json";
import type { Poi } from "@/lib/poi";

const allPois = poisData as Poi[];

export const metadata = {
  title: "Découverte — Tri'planner",
};

export default function DecouvertePage() {
  return (
    <div className="fixed inset-0">
      <SwipeDeck pois={allPois} />
    </div>
  );
}
