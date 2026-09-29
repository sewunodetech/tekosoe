import { createSecp256k1SigningSession, getEvmAddress } from '@category-labs/mera';
import type { Signer } from './types';

export class MeraSigner implements Signer {
  constructor(private readonly prfOutput: Uint8Array) {}

  getAddress(): string {
    const session = createSecp256k1SigningSession({ privateKey: this.prfOutput });
    const address = getEvmAddress(session.publicKey);
    session.end();
    return address;
  }

  async signDigest(digest32: Uint8Array) {
    const session = createSecp256k1SigningSession({ privateKey: this.prfOutput });
    try {
      return await session.signDigest(digest32);
    } finally {
      session.end();
    }
  }
}
