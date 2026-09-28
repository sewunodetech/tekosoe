export interface Signer {
  getAddress(): string;
  signDigest(digest32: Uint8Array): Promise<{ compact: Uint8Array; recovery: 0 | 1 }>;
}
