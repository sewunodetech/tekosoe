import { useTrip } from './useTrip';

/** Feed satu trip = daftar pemakaian di `Trip.activity` (live: Envio, polling). */
export function useActivity(tripId: string) {
  const query = useTrip(tripId);
  return { ...query, data: query.data?.activity };
}