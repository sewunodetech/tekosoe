import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_TRIP_IDS, repo } from "@/data/repo";
import { TripView } from "./trip-view";

export const dynamicParams = false;
export const generateStaticParams = () => DEMO_TRIP_IDS.map((id) => ({ id }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const trip = await repo.getTrip((await params).id);
  return { title: trip?.name ?? "Trip" };
}

// 07 Trip — apps/mobile/src/app/trip/[id]/index.tsx
export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await repo.getTrip(id);
  if (!trip) notFound();
  return <TripView trip={trip} />;
}
