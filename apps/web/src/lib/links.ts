/** Deep link skema app (apps/mobile/app.json → scheme: tekosoe). */
export const APP_SCHEME = "tekosoe://";

/** Domain publik — sama dengan EXPO_PUBLIC_PASSKEY_DOMAIN di app. */
export const SITE_DOMAIN = "tekosoe.xyz";

/**
 * Tujuan tombol "Get the app". Belum ada halaman toko: kalau env tidak diisi, tombol
 * mengarah ke bagian #get-app di landing.
 */
export const GET_APP_HREF = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || "/#get-app";

export function appLink(path = ""): string {
  return `${APP_SCHEME}${path}`;
}
