import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  parseSignature,
  type Address,
  type ContractFunctionArgs,
  type ContractFunctionName,
  type LocalAccount,
  type TransactionReceipt,
} from 'viem';
import {
  ausdAbi,
  ausdFaucetAbi,
  ausdPermitTypedData,
  groupVaultAbi,
  MONAD_TESTNET_CHAIN_ID,
  monadTestnet,
} from '@tekosue/shared';

import { api } from './api';
import { env, requireLive } from './env';

const transport = http(env.monadRpcUrl, { retryCount: 2, timeout: 20_000 });

/** Baca kontrak (cek ulang saldo sebelum transaksi penting). */
export const publicClient = createPublicClient({ chain: monadTestnet, transport });

export const vaultAddress = () => requireLive('groupVaultAddress');

type VaultWrite = ContractFunctionName<typeof groupVaultAbi, 'nonpayable'>;

/**
 * Biaya jaringan (FR-03): user tidak pernah memegang atau membeli MON. Sebelum setiap transaksi, kalau saldo MON
 * akun di bawah batas ini, api mengirim drip dulu (akun baru, atau isi ulang untuk akun aktif). Samakan dengan
 * `DRIP_MIN_BALANCE_MON` di apps/api.
 */
const MIN_FEE_BALANCE = parseEther(env.minFeeBalanceMon);

/** Pesan ramah kalau biaya jaringan belum bisa disiapkan (tanpa istilah kripto); dipetakan di `tx/errors.ts`. */
export const NETWORK_FEE_MESSAGE = "We're getting your account ready. Please try again in a minute.";

export async function ensureNetworkFee(account: LocalAccount): Promise<void> {
  if (!env.apiUrl) return;
  if ((await publicClient.getBalance({ address: account.address })) >= MIN_FEE_BALANCE) return;
  // api hanya menjawab "funded" setelah drip terkonfirmasi, jadi saldo sudah ada saat ini selesai.
  await api.drip(account.address).catch(() => undefined);
  // Masih ada sisa (mis. isi ulang sedang cooldown): coba saja, biasanya cukup untuk satu transaksi.
  if ((await publicClient.getBalance({ address: account.address })) === 0n) throw new Error(NETWORK_FEE_MESSAGE);
}

/**
 * Kirim satu transaksi GroupVault yang ditandatangani akun di perangkat, lalu tunggu hasilnya.
 * `simulateContract` dulu supaya alasan gagal (custom error) muncul sebelum ada biaya.
 */
export async function writeVault<F extends VaultWrite>(
  account: LocalAccount,
  functionName: F,
  args: ContractFunctionArgs<typeof groupVaultAbi, 'nonpayable', F>,
): Promise<TransactionReceipt> {
  await ensureNetworkFee(account);
  const wallet = createWalletClient({ account, chain: monadTestnet, transport });
  const { request } = await publicClient.simulateContract({
    account,
    address: vaultAddress(),
    abi: groupVaultAbi,
    functionName,
    args,
  } as never);
  const hash = await wallet.writeContract(request as never);
  return waitFor(hash);
}

async function waitFor(hash: `0x${string}`): Promise<TransactionReceipt> {
  const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
  if (receipt.status !== 'success') throw new Error('The payment could not be completed');
  return receipt;
}

// ---------------------------------------------------------------- AUSD (Agora)

export async function ausdBalance(owner: Address): Promise<bigint> {
  return publicClient.readContract({ address: env.ausdAddress, abi: ausdAbi, functionName: 'balanceOf', args: [owner] });
}

export async function ausdAllowance(owner: Address): Promise<bigint> {
  return publicClient.readContract({
    address: env.ausdAddress,
    abi: ausdAbi,
    functionName: 'allowance',
    args: [owner, vaultAddress()],
  });
}

/** Kirim AUSD dari akun ini (dipakai "Cash out", simulasi off-ramp ke "bank" demo). */
export async function transferAusd(account: LocalAccount, to: Address, amount: bigint): Promise<TransactionReceipt> {
  await ensureNetworkFee(account);
  const { request } = await publicClient.simulateContract({
    account,
    address: env.ausdAddress,
    abi: ausdAbi,
    functionName: 'transfer',
    args: [to, amount],
  });
  const wallet = createWalletClient({ account, chain: monadTestnet, transport });
  return waitFor(await wallet.writeContract(request));
}

/** Permit EIP-2612 ke vault, dalam bentuk struct `PermitSig` GroupVault. Berlaku 30 menit. */
export async function signAusdPermit(account: LocalAccount, value: bigint) {
  const nonce = await publicClient.readContract({
    address: env.ausdAddress,
    abi: ausdAbi,
    functionName: 'nonces',
    args: [account.address],
  });
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 60);
  const typed = ausdPermitTypedData({
    chainId: MONAD_TESTNET_CHAIN_ID,
    ausd: env.ausdAddress,
    owner: account.address,
    spender: vaultAddress(),
    value,
    nonce,
    deadline,
  });
  const signature = await account.signTypedData!(typed);
  const { r, s, v, yParity } = parseSignature(signature);
  return { value, deadline, v: Number(v ?? BigInt(27 + (yParity ?? 0))), r, s };
}

/**
 * Testnet: faucet AUSD Agora mengirim 10.000 AUSD ke akun ini. Butuh sedikit MON (dari drip).
 * Hanya lewat "Top up" di kartu saldo (simulasi on-ramp) — tidak diisi otomatis, supaya user merasakan alurnya.
 * Faucet punya cooldown global ±1 menit untuk semua pemanggil (teruji di testnet 30 Sep 2026).
 */
export async function requestDemoFunds(account: LocalAccount): Promise<TransactionReceipt> {
  await ensureNetworkFee(account);
  const call = {
    account,
    address: env.ausdFaucetAddress,
    abi: ausdFaucetAbi,
    functionName: 'requestFunds',
    args: [account.address],
  } as const;
  try {
    await publicClient.simulateContract(call);
  } catch {
    throw new Error("We couldn't add money to your balance right now. Please try again in a minute.");
  }
  const wallet = createWalletClient({ account, chain: monadTestnet, transport });
  return waitFor(await wallet.writeContract(call));
}
