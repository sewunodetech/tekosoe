import { formatDollars, parseDollars } from '@tekosoe/shared';

/** Dolar → bigint AUSD (6 desimal). */
export const usd = (dollars: number | string) => parseDollars(String(dollars));

/** "$150.00" */
export const money = (amount: bigint) => formatDollars(amount);

/** "+$70.00" / "−$10.00" */
export const signed = (amount: bigint) => (amount > 0n ? `+${formatDollars(amount)}` : formatDollars(amount));

/**
 * Isian nominal dari keyboard → bigint AUSD, atau `null` kalau kosong/tidak valid.
 * Menerima koma sebagai pemisah desimal (keyboard lokal) dan maks. 2 angka sen.
 */
export function parseAmountInput(text: string): bigint | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  return parseDollars(normalized.replace(/\.$/, ''));
}

/** Rapikan ketikan jadi angka dengan satu titik desimal dan maks. 2 angka sen ("1,5" → "1.5"). */
export function sanitizeAmountInput(text: string): string {
  const cleaned = text.replace(',', '.').replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  const trimmedWhole = whole.replace(/^0+(?=\d)/, '');
  return rest.length ? `${trimmedWhole || '0'}.${rest.join('').slice(0, 2)}` : trimmedWhole;
}

/** bigint AUSD → teks isian tanpa "$" dan tanpa pemisah ribuan ("1234.5"). */
export const amountToInput = (amount: bigint) => formatDollars(amount).replace(/[$,]/g, '').replace(/\.00$/, '');

/** "$150" — nominal bulat tanpa sen, untuk judul ("Jack wants to pay $150"). */
export const moneyShort = (amount: bigint) => formatDollars(amount).replace(/\.00$/, '');
