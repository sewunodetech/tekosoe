/** AUSD memakai 6 desimal. Semua nominal disimpan sebagai bigint unit terkecil. */
export const AUSD_DECIMALS = 6;
const UNIT = 10n ** BigInt(AUSD_DECIMALS);

/** "12.5" → 12_500_000n. Menolak lebih dari 6 angka di belakang koma. */
export function parseDollars(input: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(input.trim());
  if (!match) throw new Error(`Nominal tidak valid: ${input}`);
  const whole = BigInt(match[1]!);
  const frac = BigInt((match[2] ?? "").padEnd(AUSD_DECIMALS, "0"));
  return whole * UNIT + frac;
}

/** 12_500_000n → "$12.50". Satu-satunya cara menampilkan uang di UI. */
export function formatDollars(amount: bigint): string {
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;
  const cents = (abs + UNIT / 200n) / (UNIT / 100n); // bulatkan ke sen terdekat
  const whole = cents / 100n;
  const frac = (cents % 100n).toString().padStart(2, "0");
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "−" : ""}$${grouped}.${frac}`;
}

/** Bagi rata `amount` ke `n` peserta; sisa pembulatan masuk ke peserta pertama agar jumlah == amount. */
export function splitEqually(amount: bigint, n: number): bigint[] {
  if (n <= 0) throw new Error("Peserta minimal satu");
  const base = amount / BigInt(n);
  const shares = Array.from({ length: n }, () => base);
  shares[0] = base + (amount - base * BigInt(n));
  return shares;
}
