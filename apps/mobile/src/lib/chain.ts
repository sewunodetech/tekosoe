import {
  createPublicClient,
  createWalletClient,
  http,
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
} from '@tekosoe/shared';

import { env, requireLive } from './env';

const transport = http(env.monadRpcUrl, { retryCount: 2, timeout: 20_000 });

/** Baca kontrak (cek ulang saldo sebelum transaksi penting). */
export const publicClient = createPublicClient({ chain: monadTestnet, transport });

export const vaultAddress = () => requireLive('groupVaultAddress');

type VaultWrite = ContractFunctionName<typeof groupVaultAbi, 'nonpayable'>;

/**
 * Kirim satu transaksi GroupVault yang ditandatangani akun di perangkat, lalu tunggu hasilnya.
 * `simulateContract` dulu supaya alasan gagal (custom error) muncul sebelum ada biaya.
 */
export async function writeVault<F extends VaultWrite>(
  account: LocalAccount,
  functionName: F,
  args: ContractFunctionArgs<typeof groupVaultAbi, 'nonpayable', F>,
): Promise<TransactionReceipt> {
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

/** "Add demo funds": faucet AUSD testnet Agora mengirim ke akun ini. Butuh sedikit MON (dari drip). */
export async function requestDemoFunds(account: LocalAccount): Promise<TransactionReceipt> {
  const wallet = createWalletClient({ account, chain: monadTestnet, transport });
  const hash = await wallet.writeContract({
    address: env.ausdFaucetAddress,
    abi: ausdFaucetAbi,
    functionName: 'requestFunds',
    args: [account.address],
  });
  return waitFor(hash);
}
