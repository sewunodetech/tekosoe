import { createSecp256k1SigningSession } from '@category-labs/mera';
import { toViemAccount } from '@category-labs/mera/viem';
import type { Address, LocalAccount } from 'viem';

import type { Signer } from './types';

/**
 * Akun Mera: kunci secp256k1 dari PRF passkey. `toViemAccount` (Mera ≥0.2, dist/viem.d.ts)
 * menandatangani semua jenis pesan lewat `session.signDigest`, tanpa prompt passkey tambahan.
 */
export class MeraSigner implements Signer {
  private readonly session: ReturnType<typeof createSecp256k1SigningSession>;
  readonly account: LocalAccount;

  constructor(prfOutput: Uint8Array) {
    this.session = createSecp256k1SigningSession({ privateKey: prfOutput });
    this.account = toViemAccount(this.session);
  }

  get address(): Address {
    return this.account.address;
  }

  end(): void {
    this.session.end();
  }
}
