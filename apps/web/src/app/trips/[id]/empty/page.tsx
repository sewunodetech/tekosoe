import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_TRIP_IDS, repo } from "@/data/repo";
import { TripView } from "../trip-view";

export const metadata: Metadata = { title: "Pot is empty" };
export const dynamicParams = false;
export const generateStaticParams = () => DEMO_TRIP_IDS.map((id) => ({ id }));

// S1 Pot is empty — muncul setelah permintaan $150 disetujui. Dipisah dari /trips/[id] agar tetap statis.
export default async function EmptyPotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trip, lastSpend] = await Promise.all([repo.getTrip(id), repo.getSpend("japan", "train")]);
  if (!trip) notFound();
  return <TripView trip={trip} lastSpend={lastSpend ?? undefined} empty />;
}
