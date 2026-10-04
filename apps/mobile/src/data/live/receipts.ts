import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { bytesToHex, hexToBytes, type Address, type Hex, type LocalAccount } from 'viem';

import { api, ApiError, isNotFound } from '@/lib/api';
import { writeVault } from '@/lib/chain';
import { fetchGroup, waitForIndexer } from '@/lib/envio';
import {
  decryptReceipt,
  encKeyPair,
  encryptReceipt,
  fromBase64,
  newTripKey,
  receiptHash,
  toBase64,
  unwrapTripKey,
  wrapTripKey,
} from '@/lib/receipt-crypto';

/**
 * Struk LIVE (M7, ADR 0008): kompres → enkripsi kunci trip di HP → unggah ciphertext lewat URL presigned api
 * → `attachReceipt(receiptHash)` on-chain. Membuka: unduh ciphertext → cocokkan keccak256 dengan data on-chain
 * → dekripsi di HP. Server dan Envio tidak pernah melihat isi struk.
 */

const RECEIPT_MAX_WIDTH = 1600;
const RECEIPT_QUALITY = 0.7;

/** Pesan ramah untuk kegagalan api (tanpa istilah kripto). */
function friendly(error: unknown): never {
  if (error instanceof ApiError) {
    if (error.code === 'FEATURE_DISABLED' || (error.status === 404 && error.code === 'HTTP_ERROR')) {
      throw new Error('Receipts are switched off on the server right now. Your payment is fine.');
    }
    if (error.code === 'RECEIPT_TOO_LARGE') throw new Error('This photo is too large. Try a closer shot.');
  }
  throw error;
}

const published = new Set<string>();

/** Kunci publik anggota ini, sekali per sesi, supaya teman bisa membagikan kunci trip kepadanya. */
async function publishMyKey(account: LocalAccount) {
  const id = account.address.toLowerCase();
  const { publicKey } = await encKeyPair(account);
  if (published.has(id)) return publicKey;
  await api.publishEncKey(account, bytesToHex(publicKey));
  published.add(id);
  return publicKey;
}

/** Bungkus kunci trip untuk setiap anggota yang sudah punya kunci publik (api mengabaikan yang sudah ada). */
async function shareTripKey(account: LocalAccount, tripId: string, tripKey: Uint8Array) {
  const keys = await api.groupEncKeys(account, tripId);
  const wraps = keys
    .filter((k): k is { address: Address; encPublicKey: string } => Boolean(k.encPublicKey))
    .map((k) => ({ member: k.address, wrappedKey: wrapTripKey(tripKey, hexToBytes(k.encPublicKey as Hex)) }));
  if (wraps.length > 0) await api.shareTripKey(account, tripId, wraps);
}

const tripKeys = new Map<string, Uint8Array>();

/**
 * Kunci trip untuk anggota ini. Kalau belum ada salinan terbungkus untuknya:
 * - trip belum punya struk sama sekali → buat kunci baru dan bagikan ke semua anggota;
 * - sudah ada struk → kunci dipegang teman; tunggu salah satu dari mereka membuka trip (otomatis berbagi).
 */
async function tripKeyFor(account: LocalAccount, tripId: string, { create }: { create: boolean }): Promise<Uint8Array> {
  const cacheId = `${account.address.toLowerCase()}:${tripId}`;
  const cached = tripKeys.get(cacheId);
  if (cached) return cached;

  await publishMyKey(account);
  const { privateKey } = await encKeyPair(account);

  let tripKey: Uint8Array;
  try {
    tripKey = unwrapTripKey((await api.myTripKeyWrap(account, tripId)).wrappedKey, privateKey);
  } catch (error) {
    if (!isNotFound(error) || (error as ApiError).code !== 'KEY_WRAP_NOT_FOUND') friendly(error);
    const group = await fetchGroup(tripId);
    const hasReceipts = (group?.spends ?? []).some((s) => s.receiptCount > 0);
    if (!create || hasReceipts) {
      // Kunci trip dipegang teman; HP mereka membagikannya otomatis saat membuka Tekosoe (syncReceiptKeys).
      throw new Error(
        "This phone can't open this trip's receipts yet. It unlocks as soon as a friend in this trip opens Tekosoe. Try again after that.",
      );
    }
    tripKey = newTripKey();
    await shareTripKey(account, tripId, tripKey);
    // Kalau teman membuat kunci di saat yang sama, pakai kunci yang tersimpan untuk kita (insert-only).
    tripKey = unwrapTripKey((await api.myTripKeyWrap(account, tripId)).wrappedKey, privateKey);
  }

  tripKeys.set(cacheId, tripKey);
  // Anggota baru yang sudah punya kunci publik ikut mendapat salinan.
  await shareTripKey(account, tripId, tripKey).catch(() => undefined);
  return tripKey;
}

const lastSync = new Map<string, number>();
const SYNC_EVERY_MS = 60_000;

/**
 * Sinkron kunci struk di latar belakang (Home dan 07 Trip): daftarkan kunci publik HP ini, lalu kalau HP ini
 * memegang kunci trip, bagikan salinannya ke anggota yang belum punya (api insert-only). Tanpa ini kunci
 * hanya menyebar saat ada yang menambah/membuka struk, dan anggota baru tertahan "can't open receipts".
 * Diam saja kalau gagal (fitur struk mati, offline): tidak boleh mengganggu layar.
 */
export async function syncReceiptKeys(account: LocalAccount, tripId: string): Promise<void> {
  const syncId = `${account.address.toLowerCase()}:${tripId}`;
  const now = Date.now();
  if (now - (lastSync.get(syncId) ?? 0) < SYNC_EVERY_MS) return;
  lastSync.set(syncId, now);
  try {
    await publishMyKey(account);
    const cached = tripKeys.get(syncId);
    const tripKey =
      cached ?? unwrapTripKey((await api.myTripKeyWrap(account, tripId)).wrappedKey, (await encKeyPair(account)).privateKey);
    tripKeys.set(syncId, tripKey);
    await shareTripKey(account, tripId, tripKey);
  } catch {
    // Belum memegang kunci (KEY_WRAP_NOT_FOUND) atau api tidak bisa: coba lagi di sinkron berikutnya.
  }
}

/** Foto → JPEG terkompres (base64) supaya hemat kuota dan di bawah batas unggah api. */
async function compressPhoto(uri: string): Promise<Uint8Array> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: RECEIPT_MAX_WIDTH });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: RECEIPT_QUALITY, base64: true });
  if (!saved.base64) throw new Error('The photo could not be read. Try again.');
  return fromBase64(saved.base64);
}

export async function attachReceipt(account: LocalAccount, tripId: string, spendId: string, photoUri: string) {
  try {
    const tripKey = await tripKeyFor(account, tripId, { create: true });
    const sealed = encryptReceipt(tripKey, await compressPhoto(photoUri), tripId, spendId);
    const hash = receiptHash(sealed);

    const upload = await api.receiptUploadUrl(account, { groupId: tripId, spendId, sizeBytes: sealed.length, mime: 'image/jpeg' });
    const put = await fetch(upload.uploadUrl, {
      method: 'PUT',
      headers: { 'content-type': 'application/octet-stream', ...upload.headers },
      body: sealed as unknown as BodyInit,
    });
    if (!put.ok) throw new Error('The receipt could not be uploaded. Check your connection and try again.');
    await api.confirmReceipt(account, upload.receiptId, hash);

    const receipt = await writeVault(account, 'attachReceipt', [BigInt(tripId), BigInt(spendId), hash]);
    await waitForIndexer(receipt.blockNumber);
    return { receiptHash: hash };
  } catch (error) {
    friendly(error);
  }
}

/** Unduh, periksa sidik jari terhadap data on-chain, dan buka struk di HP ini. */
export async function openReceipt(account: LocalAccount, tripId: string, spendId: string, hash: Hex) {
  try {
    const tripKey = await tripKeyFor(account, tripId, { create: false });
    const found = await api.receiptByHash(account, hash);
    const res = await fetch(found.downloadUrl);
    if (!res.ok) throw new Error('The receipt could not be downloaded. Try again.');
    const sealed = new Uint8Array(await res.arrayBuffer());
    if (receiptHash(sealed).toLowerCase() !== hash.toLowerCase()) {
      throw new Error('This receipt does not match the one recorded for the payment.');
    }
    const plain = decryptReceipt(tripKey, sealed, tripId, spendId);
    return { uri: `data:${found.mime};base64,${toBase64(plain)}`, mime: found.mime };
  } catch (error) {
    friendly(error);
  }
}
