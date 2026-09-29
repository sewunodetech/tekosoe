# ADR 0003: Mera Passkey API Integration

## Konteks

Kita perlu menggunakan `@category-labs/mera` untuk membuat akun passkey, mendapatkan `prfOutput`, dan menggunakannya untuk membuat *signing session* `secp256k1` yang akan menandatangani transaksi ke jaringan Monad (EVM).

Karena platformnya adalah React Native, kita juga harus memakai *client* khusus yang disediakan oleh Mera untuk lingkungan tersebut.

## Keputusan

Kita menggunakan API resmi dari SDK `@category-labs/mera` dengan pengaturan khusus untuk React Native sebagai berikut:

1. **Client Khusus React Native**:
   Menggunakan `reactNativeWebAuthnClient` dari `@category-labs/mera/react-native-webauthn-client` (membutuhkan instalasi `react-native-passkey`).

2. **Membuat Passkey (Registrasi)**:
   ```ts
   import { createPasskeyWithPrfOutput } from '@category-labs/mera';
   import { reactNativeWebAuthnClient } from '@category-labs/mera/react-native-webauthn-client';

   const { prfOutput, credentialId, transports } = await createPasskeyWithPrfOutput({
     rp: { id: 'tekosoe.xyz', name: 'Tekosoe' },
     user: { name: 'user', displayName: 'User' },
     webAuthnClient: reactNativeWebAuthnClient,
   });
   ```

3. **Mendapatkan Passkey (Login)**:
   ```ts
   import { getPasskeyPrfOutput } from '@category-labs/mera';
   
   const { prfOutput, credentialId } = await getPasskeyPrfOutput({
     rpId: 'tekosoe.xyz',
     credential: { credentialId, transports }, // opsional
     webAuthnClient: reactNativeWebAuthnClient,
   });
   ```

4. **Signing Session & Alamat EVM**:
   ```ts
   import { createSecp256k1SigningSession, getEvmAddress } from '@category-labs/mera';

   // Buat session
   using session = createSecp256k1SigningSession({ privateKey: prfOutput });
   
   // Dapatkan alamat EVM
   const address = getEvmAddress(session.publicKey);

   // Tanda tangani digest
   const signature = await session.signDigest(digest);
   ```

## Status

**Disetujui.** Sesuai dengan hasil Spike (M2), ini adalah bentuk integrasi *passkey* PRF dan kriptografi EVM menggunakan SDK Mera di lingkungan React Native.
