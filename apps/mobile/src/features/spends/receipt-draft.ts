import { useSyncExternalStore } from 'react';

/**
 * Foto struk yang diambil di R1 sebelum pemakaian dibuat (09 Pay belum punya `spendId`).
 * Disimpan per trip di memori; 09 melampirkannya lewat `useAttachReceipt` setelah `spend` berhasil.
 */
const drafts = new Map<string, string>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setReceiptDraft(tripId: string, uri: string) {
  drafts.set(tripId, uri);
  emit();
}

export function clearReceiptDraft(tripId: string) {
  if (drafts.delete(tripId)) emit();
}

/** URI foto struk yang menunggu dilampirkan ke pemakaian berikutnya di trip ini. */
export function useReceiptDraft(tripId: string): string | undefined {
  return useSyncExternalStore(subscribe, () => drafts.get(tripId));
}
