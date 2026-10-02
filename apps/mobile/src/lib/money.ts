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

/** Maks. angka dolar utuh di isian nominal ($99,999). */
const MAX_WHOLE_DIGITS = 5;

/**
 * Ketikan dari isian nominal yang menampilkan pemisah ribuan → teks isian polos, atau `null` kalau
 * melebihi batas digit (ketikan diabaikan). Koma terakhir tanpa titik dianggap desimal (keyboard lokal).
 */
export function cleanAmountTyping(typed: string): string | null {
  const decimalComma = typed.endsWith(',') && !typed.includes('.');
  const plain = (decimalComma ? `${typed.slice(0, -1)}.` : typed).replace(/,/g, '');
  if ((plain.split('.')[0] ?? '').length > MAX_WHOLE_DIGITS) return null;
  return sanitizeAmountInput(plain);
}

/** Teks isian polos → tampilan dengan pemisah ribuan ("1234.5" → "1,234.5"). */
export function groupAmountInput(text: string): string {
  const [whole = '', ...rest] = text.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return rest.length ? `${grouped}.${rest.join('')}` : grouped;
}

/** bigint AUSD → teks isian tanpa "$" dan tanpa pemisah ribuan ("1234.5"). */
export const amountToInput = (amount: bigint) => formatDollars(amount).replace(/[$,]/g, '').replace(/\.00$/, '');

/** "$150" — nominal bulat tanpa sen, untuk judul ("Jack wants to pay $150"). */
export const moneyShort = (amount: bigint) => formatDollars(amount).replace(/\.00$/, '');
