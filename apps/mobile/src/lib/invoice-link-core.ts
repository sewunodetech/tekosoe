// Murni (tanpa Expo/env) supaya bisa dites dengan `node --test`. Logika sama dengan apps/web/src/lib/verify-link.ts.

/** Nama parameter kode akses invoice, sama dengan api (`GET /api/invoices/:number`) dan web. */
const ACCESS_PARAM = 'token';

/**
 * URL lengkap untuk QR, pesan share, dan link di PDF: `https://<domain>/v/<nomor>[?token=…]`.
 * Kode akses membuat halaman verifikasi bisa dibuka siapa pun tanpa login.
 */
export function buildInvoiceVerifyUrl(domain: string, number: string, accessKey?: string | null): string {
  const url = `https://${domain}/v/${encodeURIComponent(number)}`;
  return accessKey ? `${url}?${ACCESS_PARAM}=${encodeURIComponent(accessKey)}` : url;
}

/** Teks yang terlihat di layar dan PDF: `<domain>/v/<nomor>`, tanpa query. */
export function buildInvoiceVerifyLabel(domain: string, number: string): string {
  return `${domain}/v/${number}`;
}
