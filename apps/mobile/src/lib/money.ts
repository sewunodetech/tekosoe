import { formatDollars, parseDollars } from '@tekosoe/shared';

/** Dolar → bigint AUSD (6 desimal). */
export const usd = (dollars: number | string) => parseDollars(String(dollars));

/** "$150.00" */
export const money = (amount: bigint) => formatDollars(amount);

/** "+$70.00" / "−$10.00" */
export const signed = (amount: bigint) => (amount > 0n ? `+${formatDollars(amount)}` : formatDollars(amount));

/** "$150" — nominal bulat tanpa sen, untuk judul ("Jack wants to pay $150"). */
export const moneyShort = (amount: bigint) => formatDollars(amount).replace(/\.00$/, '');
