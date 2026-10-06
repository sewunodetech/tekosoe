/** Domain web = domain passkey (rpId): di sanalah /.well-known dilayani dan link undangan membuka app. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tekosue.xyz";

/** apps/api publik: nama trip untuk halaman undangan (`GET /api/groups/:id/meta`, tanpa login). */
export const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.mulalabs.biz.id";

/** APK Android terbaru (EAS preview). Diganti tiap build baru. */
export const androidApkUrl =
  process.env.NEXT_PUBLIC_ANDROID_APK_URL ||
  "https://expo.dev/artifacts/eas/qw2PmlQ3C_PuGI3Dg0P4pUvpT2aaYSVgUUblbKcJzt8.apk";
