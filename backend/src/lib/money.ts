/**
 * AUSD uses 6 decimals. Amounts are carried around as bigint in the smallest unit
 * and are only converted to dollars at the display layer (NFR-07 / US-05).
 */
export const AUSD_DECIMALS = 6;
export const AUSD_UNIT = 10n ** BigInt(AUSD_DECIMALS);

export const MON_DECIMALS = 18;
export const MON_UNIT = 10n ** BigInt(MON_DECIMALS);

/** "12.5" → 12_500_000n. Rejects more than 6 fractional digits. */
export function parseAusd(input: string): bigint {
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(input.trim());
  if (!match) throw new Error(`Invalid amount: ${input}`);
  const whole = BigInt(match[1]!);
  const frac = BigInt((match[2] ?? "").padEnd(AUSD_DECIMALS, "0"));
  return whole * AUSD_UNIT + frac;
}

/** 12_500_000n → "$12.50". The only way money is written for the user. */
export function formatAusd(amount: bigint): string {
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;
  const cents = (abs + AUSD_UNIT / 200n) / (AUSD_UNIT / 100n);
  const whole = cents / 100n;
  const frac = (cents % 100n).toString().padStart(2, "0");
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "−" : ""}$${grouped}.${frac}`;
}

/** 0.05 → 50_000_000_000_000_000n. Used for the MON amounts in the drip config. */
export function parseMonAmount(value: number): bigint {
  const text = value.toString();
  if (text.includes("e") || text.includes("E")) {
    throw new Error(`Amount too small to express: ${value}`);
  }
  const [whole, fraction = ""] = text.split(".");
  const padded = (fraction + "0".repeat(MON_DECIMALS)).slice(0, MON_DECIMALS);
  return BigInt(whole || "0") * MON_UNIT + BigInt(padded || "0");
}

/** wei → MON as a plain number, only for operational status output. */
export function weiToMon(wei: bigint): number {
  return Number(wei) / Number(MON_UNIT);
}
