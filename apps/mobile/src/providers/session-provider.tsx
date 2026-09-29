import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import * as SecureStore from 'expo-secure-store';
import { createPasskeyWithPrfOutput, getPasskeyPrfOutput } from '@category-labs/mera';
import { reactNativeWebAuthnClient } from '@category-labs/mera/react-native-webauthn-client';
import { bytesToHex, hexToBytes } from 'viem';

import { env } from '@/lib/env';
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

export function SessionProvider({ children }: PropsWithChildren) {
  const [signer, setSigner] = useState<Signer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      // Mode demo (web / Expo Go): tidak ada passkey tersimpan, user masuk lewat tombol sign-in.
      if (env.signer === 'demo') {
        setIsLoading(false);
        return;
      }
      try {
        const prfHex = await SecureStore.getItemAsync(PRF_STORAGE_KEY);
        if (prfHex) {
          const prfOutput = hexToBytes(prfHex as `0x${string}`);
          setSigner(new MeraSigner(prfOutput));
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
      setSigner(new DemoSigner());
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

    setSigner(new MeraSigner(prfOutput));
  };

  const signOut = async () => {
    if (env.signer === 'demo') {
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
