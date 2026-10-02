# 0003 — Mera passkey API integration

- Status: accepted
- Date: 2026-09-29

## Context

We need `@category-labs/mera` to create a passkey account, get its `prfOutput`, and use that to open a `secp256k1` signing session that signs transactions for Monad (EVM).

Because the app runs on React Native, we also need the WebAuthn client Mera provides for that environment.

## Decision

We use the official `@category-labs/mera` SDK API, set up for React Native as follows:

1. **React Native client.**
   Use `reactNativeWebAuthnClient` from `@category-labs/mera/react-native-webauthn-client` (requires `react-native-passkey`).

2. **Create a passkey (registration).**
   ```ts
   import { createPasskeyWithPrfOutput } from '@category-labs/mera';
   import { reactNativeWebAuthnClient } from '@category-labs/mera/react-native-webauthn-client';

   const { prfOutput, credentialId, transports } = await createPasskeyWithPrfOutput({
     rp: { id: 'tekosoe.xyz', name: 'Tekosoe' },
     user: { name: 'user', displayName: 'User' },
     webAuthnClient: reactNativeWebAuthnClient,
   });
   ```

3. **Use an existing passkey (sign-in).**
   ```ts
   import { getPasskeyPrfOutput } from '@category-labs/mera';

   const { prfOutput, credentialId } = await getPasskeyPrfOutput({
     rpId: 'tekosoe.xyz',
     credential: { credentialId, transports }, // optional
     webAuthnClient: reactNativeWebAuthnClient,
   });
   ```

4. **Signing session and EVM address.**
   ```ts
   import { createSecp256k1SigningSession, getEvmAddress } from '@category-labs/mera';

   // Open a session
   using session = createSecp256k1SigningSession({ privateKey: prfOutput });

   // Get the EVM address
   const address = getEvmAddress(session.publicKey);

   // Sign a digest
   const signature = await session.signDigest(digest);
   ```

## Consequences

This is the shape of the passkey PRF and EVM signing integration with the Mera SDK on React Native, as confirmed by the spike (WP M2). It still has to be verified in a development build on physical phones.
