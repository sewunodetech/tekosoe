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
  /** HP ini sudah pernah masuk (ID passkey tersimpan): buka app → langsung minta passkey (/unlock). */
  hasAccount: boolean;
  /** Masuk dengan passkey Tekosue yang sudah ada. Gagal dengan `NoCredentials` kalau belum ada. */
  signIn: () => Promise<void>;
  /** Buat passkey baru = akun baru. */
  signUp: () => Promise<void>;
  signOut: () => Promise<void>;
  /** "Use a different account": lupakan akun di HP ini tanpa harus masuk dulu. */
  forgetAccount: () => Promise<void>;
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
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    async function loadSession() {
      // Mode demo (web / Expo Go): user masuk lewat tombol sign-in.
      if (env.signer === 'demo') {
        setIsLoading(false);
        return;
      }
      try {
        setHasAccount(!!(await SecureStore.getItemAsync(CREDENTIAL_ID_KEY)));
        // Kunci tersimpan hanya dengan biometrik kelas strong. Tanpa itu (PIN, face unlock "weak"),
        // atau kalau prompt dibatalkan, app membuka /unlock yang meminta passkey.
        if (!SecureStore.canUseBiometricAuthentication()) return;
        const prfHex = await SecureStore.getItemAsync(PRF_STORAGE_KEY, {
          requireAuthentication: true,
          authenticationPrompt: 'Unlock Tekosue',
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

  const signInDemo = async () => {
    const demo = await DemoSigner.load();
    setSigner(demo);
    prepareAccount(demo);
  };

  /** Akun = fungsi deterministik dari (passkey, rpId, salt PRF Mera). Passkey yang sama → alamat yang sama. */
  const startSession = async (result: { credentialId: string; prfOutput: Uint8Array | ArrayBuffer }) => {
    const prfOutput = new Uint8Array(result.prfOutput);
    // ID passkey dulu: kalau langkah berikutnya gagal, masuk lagi tetap memakai passkey (akun) yang sama.
    await SecureStore.setItemAsync(CREDENTIAL_ID_KEY, result.credentialId);
    setHasAccount(true);
    await cachePrfOutput(prfOutput);

    const mera = new MeraSigner(prfOutput);
    setSigner(mera);
    prepareAccount(mera);
  };

  const signIn = async () => {
    if (env.signer === 'demo') return signInDemo();

    // Tanpa ID tersimpan (sign out / install ulang / HP baru) sheet menawarkan semua passkey Tekosue.
    const savedCredentialId = await SecureStore.getItemAsync(CREDENTIAL_ID_KEY);
    const result = await getPasskeyPrfOutput({
      rpId: env.passkeyDomain,
      ...(savedCredentialId ? { credential: { credentialId: savedCredentialId } } : {}),
      webAuthnClient: reactNativeWebAuthnClient,
    });
    await startSession(result);
  };

  // Sign up eksplisit: iOS (dan Android dengan opsi "perangkat lain") tidak mengembalikan `NoCredentials`
  // saat belum ada passkey — sheet tetap muncul lalu ditutup user — jadi user baru tidak bisa
  // mengandalkan fallback dari sign in.
  const signUp = async () => {
    if (env.signer === 'demo') return signInDemo();

    const result = await createPasskeyWithPrfOutput({
      rp: { id: env.passkeyDomain, name: 'Tekosue' },
      user: { name: 'user', displayName: 'Tekosue User' },
      webAuthnClient: reactNativeWebAuthnClient,
    });
    await startSession(result);
  };

  const signOut = async () => {
    signer?.end();
    clearApiSession();
    if (env.signer === 'demo') {
      // Kunci demo tetap di perangkat supaya masuk lagi memakai akun yang sama.
      setSigner(null);
      return;
    }
    await forgetAccount();
    setSigner(null);
  };

  const forgetAccount = async () => {
    await SecureStore.deleteItemAsync(PRF_STORAGE_KEY);
    await SecureStore.deleteItemAsync(CREDENTIAL_ID_KEY);
    setHasAccount(false);
  };

  return (
    <SessionContext.Provider value={{ signer, isLoading, hasAccount, signIn, signUp, signOut, forgetAccount }}>
      {children}
    </SessionContext.Provider>
  );
}
