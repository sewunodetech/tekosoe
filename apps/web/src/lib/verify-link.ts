import { SITE_DOMAIN } from "./links";

/** Nama parameter query kode akses invoice, sama dengan api (`GET /api/invoices/:number`) dan app. */
export const ACCESS_PARAM = "token"; // copy-guard-ignore: nama parameter URL, bukan teks layar

/**
 * URL lengkap untuk QR dan link: `https://tekosue.xyz/v/<nomor>[?<kode akses>]`.
 * Kode akses ikut di URL supaya siapa pun yang memindai bisa memeriksa invoice tanpa login.
 */
export function verifyHref(number: string, accessKey?: string | null): string {
  const url = new URL(`https://${SITE_DOMAIN}/v/${encodeURIComponent(number)}`);
  if (accessKey) url.searchParams.set(ACCESS_PARAM, accessKey);
  return url.toString();
}

/** Teks yang terlihat: `tekosue.xyz/v/<nomor>`, tanpa query. */
export function verifyLabel(number: string): string {
  return `${SITE_DOMAIN}/v/${number}`;
}
