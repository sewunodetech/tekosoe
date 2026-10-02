/**
 * Mode demo: foto struk yang dilampirkan di sesi ini, per pemakaian. Disimpan di memori saja
 * (data demo statis); di mode live struk terenkripsi tersimpan lewat api dan tercatat on-chain.
 */
const photos = new Map<string, string>();

const key = (tripId: string, spendId: string) => `${tripId}:${spendId}`;

export function saveDemoReceipt(tripId: string, spendId: string, uri: string) {
  photos.set(key(tripId, spendId), uri);
}

export function demoReceipt(tripId: string, spendId: string): string | undefined {
  return photos.get(key(tripId, spendId));
}
