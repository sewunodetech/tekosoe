import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import * as SecureStore from 'expo-secure-store';
import { createPasskeyWithPrfOutput, getPasskeyPrfOutput } from '@category-labs/mera';
import { reactNativeWebAuthnClient } from '@category-labs/mera/react-native-webauthn-client';
import { bytesToHex, hexToBytes } from 'viem';

import { api, clearApiSession } from '@/lib/api';
import { env, isLive } from '@/lib/env';
import type { Signer } from '@/wallet';
import { MeraSigner, DemoSigner } from '@/wallet';

interface SessionContextValue {
  signer: Signer | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

const PRF_STORAGE_KEY = 'tekosoe_prf_output';
const CREDENTIAL_ID_KEY = 'tekosoe_credential_id';

/**
 * FR-03: akun baru belum punya MON. api mengirim sedikit MON sekali per alamat (drip) supaya
 * transaksi pertama bisa jalan. Saldo dolar sengaja TIDAK diisi otomatis: user "Top up" sendiri (ADR 0006).
 * Tidak menghalangi masuk — kalau gagal, dicoba lagi saat masuk berikutnya.
 */
function prepareAccount(signer: Signer) {
  if (!isLive || !env.apiUrl) return;
  void api.drip(signer.address).catch(() => undefined);
}

/** Kode error react-native-passkey (`NoCredentials`, `UserCancelled`, …) di balik MeraError. */
export function passkeyErrorCode(err: unknown): string | undefined {
  const cause = (err as { cause?: { error?: unknown } } | null)?.cause;
  return typeof cause?.error === 'string' ? cause.error : undefined;
}

/**
 * Simpan PRF supaya buka app berikutnya cukup biometrik, tanpa sheet passkey. Hanya kalau perangkat
 * punya biometrik kelas strong (syarat `requireAuthentication`); kalau tidak, PRF tidak disimpan sama
 * sekali dan sesi dipulihkan lewat passkey lagi — kunci tidak pernah disimpan tanpa perlindungan.
 */
async function cachePrfOutput(prfOutput: Uint8Array) {
  if (!SecureStore.canUseBiometricAuthentication()) return;
  try {
    await SecureStore.setItemAsync(PRF_STORAGE_KEY, bytesToHex(prfOutput), { requireAuthentication: true });
  } catch (err) {
    console.warn('PRF not cached, next sign in uses the passkey again:', err);
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [signer, setSigner] = useState<Signer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      // Mode demo (web / Expo Go): user masuk lewat tombol sign-in.
      if (env.signer === 'demo') {
        setIsLoading(false);
        return;
      }
      try {
        if (!SecureStore.canUseBiometricAuthentication()) return;
        const prfHex = await SecureStore.getItemAsync(PRF_STORAGE_KEY, {
          requireAuthentication: true,
          authenticationPrompt: 'Unlock Tekosoe',
        });
        if (prfHex) {
          const restored = new MeraSigner(hexToBytes(prfHex as `0x${string}`));
          setSigner(restored);
          prepareAccount(restored);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  const signIn = async () => {
    if (env.signer === 'demo') {
      const demo = await DemoSigner.load();
      setSigner(demo);
      prepareAccount(demo);
      return;
    }

    // Check if we have a saved credential
    const savedCredentialId = await SecureStore.getItemAsync(CREDENTIAL_ID_KEY);

    let prfOutput: Uint8Array;
    let newCredentialId: string;

    // Akun = fungsi deterministik dari (passkey, rpId, salt PRF Mera). Passkey yang sama → alamat yang sama.
    // Tanpa ID tersimpan (sign out / install ulang / HP baru) tawarkan dulu passkey yang sudah ada;
    // passkey baru (= akun baru) hanya dibuat kalau perangkat memang belum punya passkey Tekosoe.
    let result: { credentialId: string; prfOutput: Uint8Array | ArrayBuffer };
    try {
      result = await getPasskeyPrfOutput({
        rpId: env.passkeyDomain,
        ...(savedCredentialId ? { credential: { credentialId: savedCredentialId } } : {}),
        webAuthnClient: reactNativeWebAuthnClient,
      });
    } catch (err) {
      if (passkeyErrorCode(err) !== 'NoCredentials') throw err;
      result = await createPasskeyWithPrfOutput({
        rp: { id: env.passkeyDomain, name: 'Tekosoe' },
        user: { name: 'user', displayName: 'Tekosoe User' },
        webAuthnClient: reactNativeWebAuthnClient,
      });
    }
    prfOutput = new Uint8Array(result.prfOutput);
    newCredentialId = result.credentialId;

    // ID passkey dulu: kalau langkah berikutnya gagal, masuk lagi tetap memakai passkey (akun) yang sama.
    await SecureStore.setItemAsync(CREDENTIAL_ID_KEY, newCredentialId);
    await cachePrfOutput(prfOutput);

    const mera = new MeraSigner(prfOutput);
    setSigner(mera);
    prepareAccount(mera);
  };

  const signOut = async () => {
    signer?.end();
    clearApiSession();
    if (env.signer === 'demo') {
      // Kunci demo tetap di perangkat supaya masuk lagi memakai akun yang sama.
      setSigner(null);
      return;
    }
    await SecureStore.deleteItemAsync(PRF_STORAGE_KEY);
    await SecureStore.deleteItemAsync(CREDENTIAL_ID_KEY);
    setSigner(null);
  };

  return (
    <SessionContext.Provider value={{ signer, isLoading, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}
