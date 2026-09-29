import type { Signer } from './types';

export class DemoSigner implements Signer {
  getAddress(): string {
    return '0x000000000000000000000000000000000000DEMO';
  }

  async signDigest(digest32: Uint8Array) {
    // Return dummy 64-byte signature and recovery id 0
    return { compact: new Uint8Array(64), recovery: 0 as const };
  }
}
