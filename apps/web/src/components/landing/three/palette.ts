/**
 * Warna scene 3D landing — gaya kartun mengikuti maskot Teko (components/Teko.tsx)
 * dan token di globals.css. Lihat ADR 0010: pengecualian dari aturan "dua warna" landing,
 * hanya untuk objek 3D; teks dan UI landing tetap netral + teal.
 */
export const C = {
  ink: "#2a3436",
  body: "#9fe0cf",
  bodyShade: "#86d2bf",
  belly: "#c9f0e4",
  teal: "#1f7a6e",
  orange: "#ff9a62",
  coin: "#ffd66b",
  coinEdge: "#f2b84b",
  peach: "#ffe0cc",
  lilac: "#cfc6ff",
  sky: "#d6e4ff",
  mint: "#dcf0ea",
  white: "#ffffff",
} as const;

/** Warna avatar teman (urutan dipakai berulang). */
export const FRIENDS = [C.orange, C.lilac, C.sky, C.peach] as const;
