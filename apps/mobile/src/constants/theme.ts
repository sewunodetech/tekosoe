/**
 * Token desain Tekosoe — diambil dari canvas "Tekosoe — Wireframe", halaman "Final UI" (F01–F13, S01–S12).
 * Desain hanya punya mode terang (latar ivory). Kalau desain berubah, perbarui nilai di sini, bukan di layar.
 */

import type { TextStyle } from 'react-native';

/** Warna mentah dari desain. Layar sebaiknya memakai `colors` (semantik) di bawah. */
export const palette = {
  ivory: '#faf8f3',
  white: '#ffffff',
  ink: '#1d2426',
  inkSoft: '#2a3436',
  slate: '#5f6b6d',
  slateLight: '#7c8789',
  teal: '#1f7a6e',
  tealDeep: '#16574e',
  tealInk: '#234a44',
  tealMuted: '#3f5b56',
  mint: '#dcf0ea',
  mintCard: '#cfe9e1',
  mintCardDeco: '#b8dfd3',
  mintDeep: '#bfe4da',
  mintBright: '#8ed8c6',
  green: '#1c7a4f',
  greenDeep: '#145c3b',
  greenSoft: '#cdeedd',
  orange: '#ff9a62',
  peach: '#ffe8da',
  peachSoft: '#ffe0cc',
  cream: '#fff4ec',
  apricot: '#ffdccb',
  brown: '#a4561f',
  brownDeep: '#8a4a22',
  rust: '#8a3b12',
  coin: '#ffd66b',
  butter: '#fff0c2',
  sky: '#d6e4ff',
  skySoft: '#e6eefc',
  mist: '#eef1f6',
  mistInk: '#56627a',
  lavender: '#b9aef5',
  lilac: '#cfc6ff',
  line: '#e6e2d8',
  lineStrong: '#cfcabd',
  sand: '#f1eee6',
  skeleton: '#eceae4',
  cameraBg: '#e9efec',
  /** Kartu trip kedua (S5 Euro Summer). */
  violet: '#ece8ff',
  violetDeep: '#ddd6ff',
  violetInk: '#4d4870',
  violetSoft: '#e3ddff',
  /** Badge invoice Paid. */
  navy: '#1f3f7a',
  /** Teks hangat di kartu cream. */
  cocoa: '#6b5e55',
  bark: '#4d4a45',
  honey: '#ffc56b',
} as const;

/** Warna semantik — pakai ini di komponen dan layar. */
export const colors = {
  background: palette.ivory,
  surface: palette.white,
  surfaceMuted: palette.sand,
  text: palette.ink,
  textMuted: palette.slate,
  textOnPrimary: palette.white,
  border: palette.line,
  borderStrong: palette.lineStrong,

  primary: palette.teal,
  primaryPressed: palette.tealDeep,
  accent: palette.orange,

  /** Kartu hero (pot, trip aktif) dan info box. */
  hero: palette.mint,
  heroDeco: palette.mintDeep,
  heroText: palette.tealMuted,
  infoBg: palette.mint,
  infoText: palette.tealInk,

  /** Kartu hangat: tips Teko, safety net, detail pengeluaran. */
  warmBg: palette.cream,

  positive: palette.green,
  positiveBg: palette.greenSoft,
  positiveText: palette.greenDeep,
  /** Status yang perlu perhatian tapi bukan error ("No receipt", menunggu persetujuan, safety net). Netral hangat, bukan merah. */
  notice: palette.cocoa,
  /** HANYA untuk error (validasi, transaksi gagal). Status biasa seperti invoice Due tidak boleh merah. */
  danger: palette.rust,

  /** Pot kosong (S1) — Teko tidur. */
  sleepBg: palette.mist,
  sleepText: palette.mistInk,
  /** Ditolak / offline (S3, S4). */
  sadBg: palette.skySoft,

  tabActive: palette.teal,
  tabInactive: palette.slateLight,
} as const;

/** Warna avatar anggota (lingkaran berinisial). */
export const avatarColors = [palette.apricot, palette.greenSoft, palette.sky, palette.violetSoft, palette.butter, palette.peachSoft] as const;

/** Nama font setelah dimuat di `app/_layout.tsx` (Bricolage Grotesque untuk judul/angka, Manrope untuk teks). */
export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displayMedium: 'BricolageGrotesque_500Medium',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyExtraBold: 'Manrope_800ExtraBold',
} as const;

export const radius = {
  pill: 999,
  input: 16,
  button: 18,
  row: 18,
  card: 22,
  hero: 28,
  iconTile: 14,
} as const;

/** Skala tipografi dari desain. */
export const type = {
  /** Angka besar: pot, nominal ($150.00, $0.00). */
  amountXL: { fontFamily: fonts.display, fontSize: 44, lineHeight: 46, letterSpacing: -1 },
  /** Judul layar besar ("One pot for the whole trip."). */
  hero: { fontFamily: fonts.display, fontSize: 36, lineHeight: 38, letterSpacing: -1 },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, letterSpacing: -0.4 },
  /** Judul header layar dan nama trip. */
  h3: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  small: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fonts.bodyBold, fontSize: 16 },
} satisfies Record<string, TextStyle>;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Padding horizontal layar di desain. */
export const screenPadding = 20;
