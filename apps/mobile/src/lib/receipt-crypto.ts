import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { x25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';
import { hexToBytes, keccak256, type Hex, type LocalAccount } from 'viem';

/**
 * Kriptografi struk (M7, ADR 0008). Semua terjadi di HP; server hanya pernah melihat ciphertext.
 *
 * - Kunci enkripsi anggota: pasangan X25519 yang diturunkan dari tanda tangan deterministik akun di perangkat
 *   (kunci Mera dari passkey). Passkey yang sama → kunci yang sama di HP mana pun, tanpa menyimpan apa pun.
 * - Kunci trip: AES-256 acak, dibungkus (ECIES X25519 + HKDF + AES-GCM) untuk tiap anggota.
 * - Struk: AES-256-GCM dengan kunci trip; `receiptHash = keccak256(ciphertext)` dicatat on-chain.
 */

const ENC_KEY_MESSAGE = 'Tekosue receipts\n\nUnlock the key that opens receipts in your trips.\n\nv1';
const WRAP_INFO = 'tekosoe/trip-key-wrap/v1';
const NONCE_BYTES = 12;

export type EncKeyPair = { privateKey: Uint8Array; publicKey: Uint8Array };

const keyPairs = new Map<string, Promise<EncKeyPair>>();

/** Kunci enkripsi anggota, sekali per sesi per alamat (tanda tangan secp256k1 RFC 6979 bersifat deterministik). */
export function encKeyPair(account: LocalAccount): Promise<EncKeyPair> {
  const id = account.address.toLowerCase();
  let pair = keyPairs.get(id);
  if (!pair) {
    pair = account.signMessage({ message: ENC_KEY_MESSAGE }).then((signature) => {
      const privateKey = sha256(hexToBytes(signature));
      return { privateKey, publicKey: x25519.getPublicKey(privateKey) };
    });
    pair.catch(() => keyPairs.delete(id));
    keyPairs.set(id, pair);
  }
  return pair;
}

export const newTripKey = () => randomBytes(32);

/** Bungkus kunci trip untuk satu anggota: efemeral(32) ‖ nonce(12) ‖ AES-GCM(kunci trip). */
export function wrapTripKey(tripKey: Uint8Array, recipientPublicKey: Uint8Array): string {
  const ephemeral = x25519.utils.randomPrivateKey();
  const kek = hkdf(sha256, x25519.getSharedSecret(ephemeral, recipientPublicKey), undefined, WRAP_INFO, 32);
  const nonce = randomBytes(NONCE_BYTES);
  const sealed = gcm(kek, nonce).encrypt(tripKey);
  return toBase64(concat(x25519.getPublicKey(ephemeral), nonce, sealed));
}

export function unwrapTripKey(wrapped: string, privateKey: Uint8Array): Uint8Array {
  const bytes = fromBase64(wrapped);
  const ephemeralPublic = bytes.slice(0, 32);
  const nonce = bytes.slice(32, 32 + NONCE_BYTES);
  const kek = hkdf(sha256, x25519.getSharedSecret(privateKey, ephemeralPublic), undefined, WRAP_INFO, 32);
  return gcm(kek, nonce).decrypt(bytes.slice(32 + NONCE_BYTES));
}

/** Data tambahan GCM: ciphertext hanya bisa dibuka sebagai struk untuk pemakaian ini. */
const receiptAad = (tripId: string, spendId: string) => new TextEncoder().encode(`tekosoe/receipt/v1/${tripId}/${spendId}`);

/** nonce(12) ‖ AES-256-GCM(isi file). */
export function encryptReceipt(tripKey: Uint8Array, plain: Uint8Array, tripId: string, spendId: string): Uint8Array {
  const nonce = randomBytes(NONCE_BYTES);
  return concat(nonce, gcm(tripKey, nonce, receiptAad(tripId, spendId)).encrypt(plain));
}

export function decryptReceipt(tripKey: Uint8Array, sealed: Uint8Array, tripId: string, spendId: string): Uint8Array {
  return gcm(tripKey, sealed.slice(0, NONCE_BYTES), receiptAad(tripId, spendId)).decrypt(sealed.slice(NONCE_BYTES));
}

/** Sidik jari yang dicatat lewat `attachReceipt` dan diperiksa api saat konfirmasi unggahan. */
export const receiptHash = (sealed: Uint8Array): Hex => keccak256(sealed);

// ---------------------------------------------------------------- bytes

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
