import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Address, Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { inviteDigest, MONAD_TESTNET_CHAIN_ID } from '@tekosue/shared';

import { env } from './env';

/**
 * Undangan (ADR 0005): link membawa kunci privat undangan; yang bergabung menandatangani
 * `inviteDigest(vault, chainId, groupId, dirinya)` dengan kunci itu. Rahasia tidak pernah dikirim ke api
 * dan tidak pernah muncul di chain.
 *
 * Kode undangan = `${groupId}-${secret tanpa 0x}` → tekosoe://invite/<kode>, https://<webDomain>/j/<kode> (route app/j/[code]).
 */
export function newInviteSecret(): { secret: Hex; inviteKey: Address } {
  const secret = generatePrivateKey();
  return { secret, inviteKey: privateKeyToAccount(secret).address };
}

export function encodeInviteCode(groupId: string, secret: Hex): string {
  return `${groupId}-${secret.slice(2)}`;
}

/** `null` untuk kode demo (mis. "japan") atau kode yang rusak. */
export function decodeInviteCode(code: string): { groupId: string; secret: Hex } | null {
  const match = /^(\d+)-([0-9a-fA-F]{64})$/.exec(code ?? '');
  return match ? { groupId: match[1]!, secret: `0x${match[2]}` as Hex } : null;
}

/** Id trip dari parameter route undangan: kode live → groupId, selain itu apa adanya (demo). */
export const tripIdFromInvite = (code: string) => decodeInviteCode(code)?.groupId ?? code;

export async function signInvite(secret: Hex, vault: Address, groupId: string, joiner: Address): Promise<Hex> {
  const digest = inviteDigest(vault, MONAD_TESTNET_CHAIN_ID, BigInt(groupId), joiner);
  return privateKeyToAccount(secret).signMessage({ message: { raw: digest } });
}

export const inviteUrl = (code: string) => `https://${env.webDomain}/j/${code}`;

// Pembuat trip menyimpan rahasianya di perangkat supaya bisa membagikan link lagi.
const storeKey = (groupId: string) => `tekosoe_invite_${groupId}`;

export async function saveInviteSecret(groupId: string, secret: Hex): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(storeKey(groupId), secret);
    else await SecureStore.setItemAsync(storeKey(groupId), secret);
  } catch {
    // Tanpa penyimpanan: link hanya bisa dibagikan dari layar pembuatan.
  }
}

export async function loadInviteCode(groupId: string): Promise<string | null> {
  try {
    const secret =
      Platform.OS === 'web'
        ? globalThis.localStorage?.getItem(storeKey(groupId))
        : await SecureStore.getItemAsync(storeKey(groupId));
    return secret ? encodeInviteCode(groupId, secret as Hex) : null;
  } catch {
    return null;
  }
}
