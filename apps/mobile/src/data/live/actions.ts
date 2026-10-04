import { parseEventLogs, type Address, type Hex, type LocalAccount, type TransactionReceipt } from 'viem';
import { computeNoteHash, groupVaultAbi } from '@tekosoe/shared';

import { api } from '@/lib/api';
import {
  ausdAllowance,
  ausdBalance,
  publicClient,
  requestDemoFunds,
  signAusdPermit,
  transferAusd,
  vaultAddress,
  writeVault,
} from '@/lib/chain';
import { env } from '@/lib/env';
import { waitForIndexer } from '@/lib/envio';
import { decodeInviteCode, encodeInviteCode, newInviteSecret, saveInviteSecret, signInvite } from '@/lib/invite';
import { usd } from '@/lib/money';

/**
 * Transaksi LIVE ke GroupVault (ditandatangani akun di perangkat, gas dari drip MON).
 * Error dilempar dengan kata-kata ramah (tanpa istilah kripto); `mapTxError` memetakan sisanya.
 * Setiap aksi baru selesai setelah Envio memproses bloknya, jadi data yang diambil ulang sudah terbaru.
 */

/**
 * Saldo dolar harus cukup. Tidak diisi otomatis (ADR 0006): user melakukan "Top up" sendiri
 * supaya merasakan alur on-ramp. Layar sudah mengarahkan ke Top up sebelum sampai ke sini.
 */
async function requireBalance(account: LocalAccount, amount: bigint) {
  if (amount === 0n) return;
  if ((await ausdBalance(account.address)) < amount) throw new Error('Not enough dollars. Top up first.');
}

async function indexed(receipt: TransactionReceipt): Promise<TransactionReceipt> {
  await waitForIndexer(receipt.blockNumber);
  return receipt;
}

function eventArgs<N extends 'GroupCreated' | 'SpendExecuted' | 'SpendRequested'>(receipt: TransactionReceipt, eventName: N) {
  const vault = vaultAddress().toLowerCase();
  const logs = receipt.logs.filter((log) => log.address.toLowerCase() === vault);
  return parseEventLogs({ abi: groupVaultAbi, logs, eventName })[0]?.args;
}

async function pullCapOf(groupId: bigint, member: Address): Promise<bigint> {
  const position = await publicClient.readContract({
    address: vaultAddress(),
    abi: groupVaultAbi,
    functionName: 'positionOf',
    args: [groupId, member],
  });
  return position[3];
}

const myPullCap = (account: LocalAccount, groupId: bigint) => pullCapOf(groupId, account.address);

/** Safety net trip = safety net pembuat (dipilih di 04 New trip); anggota baru memakai angka yang sama. */
export async function tripSafetyNet(tripId: string): Promise<bigint> {
  const groupId = BigInt(tripId);
  const group = await publicClient.readContract({
    address: vaultAddress(),
    abi: groupVaultAbi,
    functionName: 'getGroup',
    args: [groupId],
  });
  return pullCapOf(groupId, group.creator);
}

export async function createTrip(
  account: LocalAccount,
  input: { name: string; endsAt: Date; limit: number; safetyNet: number },
) {
  const endsAt = BigInt(Math.floor(input.endsAt.getTime() / 1000));
  if (endsAt * 1000n <= BigInt(Date.now())) throw new Error('The end date must be in the future.');

  const { secret, inviteKey } = newInviteSecret();
  const receipt = await indexed(
    await writeVault(account, 'createGroup', [
      input.name,
      inviteKey,
      endsAt,
      BigInt(env.disputeWindowSeconds),
      usd(input.limit),
      usd(input.safetyNet),
    ]),
  );
  const created = eventArgs(receipt, 'GroupCreated') as { groupId: bigint } | undefined;
  if (!created) throw new Error('The trip could not be created');
  const groupId = created.groupId.toString();

  await saveInviteSecret(groupId, secret);
  // Label saja — kalau api sedang tidak bisa, trip tetap ada (nama juga tersimpan on-chain).
  await api.saveGroupMeta(account, groupId, input.name).catch(() => undefined);
  return { id: groupId, inviteCode: encodeInviteCode(groupId, secret) };
}

/**
 * Gabung cukup dengan undangan (ADR 0009): tanpa setoran, jadi tidak butuh dolar. Safety net = pilihan
 * pembuat trip, disetujui dengan menekan Join; izinnya lewat permit (tanda tangan di HP, tanpa Face ID
 * tambahan). Permit menimpa izin lama, jadi izin yang sudah ada (trip lain) ditambahkan, bukan diganti.
 */
export async function joinTrip(account: LocalAccount, code: string) {
  const invite = decodeInviteCode(code);
  if (!invite) throw new Error('This invite link has expired.');
  const groupId = BigInt(invite.groupId);
  const inviteSig = await signInvite(invite.secret, vaultAddress(), invite.groupId, account.address);
  const safetyNet = await tripSafetyNet(invite.groupId);

  if (safetyNet === 0n) {
    await indexed(await writeVault(account, 'joinGroup', [groupId, inviteSig, 0n, 0n]));
  } else {
    const permit = await signAusdPermit(account, (await ausdAllowance(account.address)) + safetyNet);
    await indexed(await writeVault(account, 'joinGroupWithPermit', [groupId, inviteSig, safetyNet, 0n, permit]));
  }
  return { tripId: invite.groupId };
}

export async function deposit(account: LocalAccount, tripId: string, amountDollars: number) {
  const amount = usd(amountDollars);
  await requireBalance(account, amount);
  const groupId = BigInt(tripId);
  // Pertahankan izin safety net setelah setoran memakai sebagian allowance.
  const [allowance, pullCap] = await Promise.all([ausdAllowance(account.address), myPullCap(account, groupId)]);
  const permit = await signAusdPermit(account, amount + (allowance > pullCap ? allowance : pullCap));
  await indexed(await writeVault(account, 'depositWithPermit', [groupId, amount, permit]));
}

export async function createSpend(
  account: LocalAccount,
  tripId: string,
  input: { amount: bigint; title: string; category: string; participants: `0x${string}`[]; shares: bigint[] },
) {
  const to = env.demoShopAddress;
  if (!to) throw new Error('EXPO_PUBLIC_DEMO_SHOP_ADDRESS is not set');
  const note = { title: input.title, category: input.category, note: '', receiptHash: null };
  const noteHash = computeNoteHash(note);

  const receipt = await indexed(
    await writeVault(account, 'spend', [BigInt(tripId), to, input.amount, input.participants, input.shares, noteHash]),
  );
  const executed = eventArgs(receipt, 'SpendExecuted') as { spendId: bigint } | undefined;
  const requested = eventArgs(receipt, 'SpendRequested') as { spendId: bigint } | undefined;
  const spendId = (executed ?? requested)?.spendId.toString();
  if (!spendId) throw new Error('The payment could not be recorded');

  // api menolak kalau computeNoteHash ≠ noteHash on-chain; judul ikut hash, jadi cocok.
  await api.saveSpendMeta(account, tripId, spendId, note).catch(() => undefined);
  return { spendId, pending: !executed };
}

export const approveSpend = async (account: LocalAccount, tripId: string, spendId: string) =>
  indexed(await writeVault(account, 'approveSpend', [BigInt(tripId), BigInt(spendId)]));

export const rejectSpend = async (account: LocalAccount, tripId: string, spendId: string) =>
  indexed(await writeVault(account, 'rejectSpend', [BigInt(tripId), BigInt(spendId)]));

export const disputeShare = async (account: LocalAccount, tripId: string, spendId: string) =>
  indexed(await writeVault(account, 'disputeShare', [BigInt(tripId), BigInt(spendId)]));

export async function payDebt(account: LocalAccount, tripId: string, amount: bigint) {
  await requireBalance(account, amount);
  const permit = await signAusdPermit(account, amount);
  return indexed(await writeVault(account, 'payDebtWithPermit', [BigInt(tripId), amount, permit]));
}

/** Batas satu kali Top up di testnet = jatah satu permintaan faucet AUSD Agora. */
export const TOP_UP_MAX = usd(10_000);

/**
 * Testnet: "Top up" sebesar `amount` (simulasi on-ramp). Faucet AUSD Agora selalu mengirim 10.000,
 * jadi kelebihannya langsung dikembalikan ke faucet — saldo user naik tepat `amount`.
 * Dua transaksi (faucet + pengembalian) kecuali `amount` = 10.000. Mainnet: on-ramp mitra.
 * Pengembalian sengaja ke faucet (bukan "bank" Cash out) supaya indexer bisa membedakan
 * Top up (faucet → user, dikurangi user → faucet) dari Cash out (user → bank).
 */
export async function topUpBalance(account: LocalAccount, amount: bigint) {
  if (amount <= 0n || amount > TOP_UP_MAX) throw new Error('Top up between $1 and $10,000 at a time.');
  const before = await ausdBalance(account.address);
  await requestDemoFunds(account);
  const received = (await ausdBalance(account.address)) - before;
  const extra = received - amount;
  if (extra > 0n) await transferAusd(account, env.ausdFaucetAddress, extra);
}

/**
 * Testnet: "Cash out" (simulasi off-ramp) — dolar sungguhan keluar dari saldo ke "bank" demo
 * (EXPO_PUBLIC_CASH_OUT_ADDRESS), tanpa transfer bank sungguhan. Mainnet: off-ramp mitra.
 */
export async function cashOut(account: LocalAccount, amount: bigint) {
  const bank = env.cashOutAddress;
  if (!bank) throw new Error('EXPO_PUBLIC_CASH_OUT_ADDRESS is not set');
  await requireBalance(account, amount);
  return transferAusd(account, bank, amount);
}

export type { Hex };
