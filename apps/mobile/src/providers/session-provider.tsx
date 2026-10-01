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
        const prfHex = await SecureStore.getItemAsync(PRF_STORAGE_KEY);
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

    if (savedCredentialId) {
      // Login with existing credential
      const result = await getPasskeyPrfOutput({
        rpId: env.passkeyDomain,
        credential: { credentialId: savedCredentialId },
        webAuthnClient: reactNativeWebAuthnClient,
      });
      prfOutput = new Uint8Array(result.prfOutput);
      newCredentialId = result.credentialId;
    } else {
      // Register new passkey
      const result = await createPasskeyWithPrfOutput({
        rp: { id: env.passkeyDomain, name: 'Tekosoe' },
        user: { name: 'user', displayName: 'Tekosoe User' },
        webAuthnClient: reactNativeWebAuthnClient,
      });
      prfOutput = new Uint8Array(result.prfOutput);
      newCredentialId = result.credentialId;
    }

    // Save to SecureStore
    await SecureStore.setItemAsync(PRF_STORAGE_KEY, bytesToHex(prfOutput));
    await SecureStore.setItemAsync(CREDENTIAL_ID_KEY, newCredentialId);

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
