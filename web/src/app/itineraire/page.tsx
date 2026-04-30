import { Itinerary } from "@/components/Itinerary";
import poisData from "@/data/pois.json";
import type { Poi } from "@/lib/poi";

const allPois = poisData as Poi[];

export const metadata = {
  title: "Itinéraire — Tri'planner",
};

export default function ItinerairePage() {
  return <Itinerary pois={allPois} />;
}
