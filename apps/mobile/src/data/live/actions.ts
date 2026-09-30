import { parseEventLogs, type Hex, type LocalAccount, type TransactionReceipt } from 'viem';
import { computeNoteHash, groupVaultAbi } from '@tekosoe/shared';

import { api } from '@/lib/api';
import { ausdAllowance, ausdBalance, publicClient, requestDemoFunds, signAusdPermit, vaultAddress, writeVault } from '@/lib/chain';
import { env } from '@/lib/env';
import { waitForIndexer } from '@/lib/envio';
import { decodeInviteCode, encodeInviteCode, newInviteSecret, saveInviteSecret, signInvite } from '@/lib/invite';
import { usd } from '@/lib/money';

/**
 * Transaksi LIVE ke GroupVault (ditandatangani akun di perangkat, gas dari drip MON).
 * Error dilempar dengan kata-kata ramah (tanpa istilah kripto); `mapTxError` memetakan sisanya.
 * Setiap aksi baru selesai setelah Envio memproses bloknya, jadi data yang diambil ulang sudah terbaru.
 */

/** Safety net pembuat trip (layar New trip belum punya isian; sama dengan default layar Join). */
const CREATOR_SAFETY_NET = usd(50);

/** Isi saldo otomatis di latar belakang kalau di bawah ini (faucet memberi 10.000 per permintaan). */
const PREFUND_BELOW = usd(500);

/**
 * Testnet: saldo kurang → isi otomatis dari faucet AUSD Agora, di dalam alur yang sama
 * (user hanya melihat "Processing"). Di mainnet tempat ini diganti on-ramp.
 */
async function ensureBalance(account: LocalAccount, amount: bigint) {
  if (amount === 0n) return;
  if ((await ausdBalance(account.address)) >= amount) return;
  await requestDemoFunds(account);
  if ((await ausdBalance(account.address)) < amount) throw new Error('Not enough balance for this amount.');
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

async function myPullCap(account: LocalAccount, groupId: bigint): Promise<bigint> {
  const position = await publicClient.readContract({
    address: vaultAddress(),
    abi: groupVaultAbi,
    functionName: 'positionOf',
    args: [groupId, account.address],
  });
  return position[3];
}

export async function createTrip(account: LocalAccount, input: { name: string; endsAt: Date; limit: number }) {
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
      CREATOR_SAFETY_NET,
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

export async function joinTrip(account: LocalAccount, code: string, input: { putIn: number; safetyNet: number }) {
  const invite = decodeInviteCode(code);
  if (!invite) throw new Error('This invite link has expired.');
  const putIn = usd(input.putIn);
  const safetyNet = usd(input.safetyNet);
  await ensureBalance(account, putIn);

  const inviteSig = await signInvite(invite.secret, vaultAddress(), invite.groupId, account.address);
  // Satu transaksi, satu Face ID: izin AUSD (setoran + safety net) lewat permit.
  const permit = await signAusdPermit(account, putIn + safetyNet);
  await indexed(
    await writeVault(account, 'joinGroupWithPermit', [BigInt(invite.groupId), inviteSig, safetyNet, putIn, permit]),
  );
  return { tripId: invite.groupId };
}

export async function deposit(account: LocalAccount, tripId: string, amountDollars: number) {
  const amount = usd(amountDollars);
  await ensureBalance(account, amount);
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
  await ensureBalance(account, amount);
  const permit = await signAusdPermit(account, amount);
  return indexed(await writeVault(account, 'payDebtWithPermit', [BigInt(tripId), amount, permit]));
}

/**
 * Testnet: isi saldo di latar belakang setelah masuk, supaya setoran pertama tidak perlu menunggu faucet.
 * Butuh MON dari drip dulu (dikirim api saat masuk), jadi tunggu sebentar sampai MON tiba. Tidak pernah gagal.
 */
export async function prefundAccount(account: LocalAccount) {
  try {
    if ((await ausdBalance(account.address)) >= PREFUND_BELOW) return;
    const deadline = Date.now() + 30_000;
    while ((await publicClient.getBalance({ address: account.address })) === 0n) {
      if (Date.now() > deadline) return;
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
    await requestDemoFunds(account);
  } catch {
    // Faucet sibuk atau koneksi putus: ensureBalance mencoba lagi saat user benar-benar menyetor.
  }
}

export type { Hex };
