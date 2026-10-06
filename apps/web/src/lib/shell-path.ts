/**
 * Segmen path setelah `prefix` (mis. "/j/"), sudah di-decode; "" kalau tidak cocok.
 * Halaman shell statis (/j/_ dan /v/_) membaca kode/nomor dari sini, bukan dari `params`.
 */
export function segmentAfter(pathname: string, prefix: string): string {
  if (!pathname.startsWith(prefix)) return "";
  const segment = pathname.slice(prefix.length).replace(/\/$/, "");
  if (!segment || segment.includes("/")) return "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return "";
  }
}
