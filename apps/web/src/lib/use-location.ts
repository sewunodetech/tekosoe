"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Path dan query halaman di browser; `null` saat prerender. Halaman shell statis (/j/_, /v/_)
 * membaca kode/nomor dari sini karena `params` saat build selalu "_".
 */
export function useBrowserLocation(): { pathname: string; search: string } | null {
  const pathname = useSyncExternalStore(subscribe, () => window.location.pathname, () => null);
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  return pathname === null ? null : { pathname, search };
}
