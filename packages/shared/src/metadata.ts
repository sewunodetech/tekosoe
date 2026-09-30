import { keccak256, toBytes, type Hex } from "viem";
import { z } from "zod";

/**
 * Metadata off-chain yang disimpan di database (Postgres) lewat apps/api.
 * Setiap baris dikunci ke data on-chain lewat groupId dan noteHash (docs/03-spesifikasi-teknis.md › Database off-chain).
 */

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const bytes32 = z.string().regex(/^0x[0-9a-fA-F]{64}$/);

export const spendNoteSchema = z.object({
  title: z.string().min(1).max(80),
  category: z.string().max(32).default("other"),
  note: z.string().max(500).default(""),
  receiptHash: bytes32.nullable().default(null),
});
export type SpendNote = z.infer<typeof spendNoteSchema>;

export const profileSchema = z.object({
  address,
  displayName: z.string().min(1).max(40),
  city: z.string().max(60).optional(),
  countryCode: z.string().length(2),
  avatarColor: z.string().optional(),
});
export type Profile = z.infer<typeof profileSchema>;

export const invoiceStatusSchema = z.enum(["paid", "refunded", "due"]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

/** JSON kanonik: kunci diurutkan, tanpa spasi. Dipakai untuk noteHash dan invoice_hash. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}

/** noteHash = keccak256(JSON kanonik {title, category, note, receiptHash}); dikirim ke `spend`. */
export function computeNoteHash(note: SpendNote): Hex {
  const { title, category, note: text, receiptHash } = spendNoteSchema.parse(note);
  return keccak256(toBytes(canonicalJson({ title, category, note: text, receiptHash })));
}

/**
 * Invoice per anggota setelah `settle` (docs/03 â€º Invoice trip per anggota).
 *
 * Yang di-hash hanya hasil settle yang bisa dihitung ulang siapa pun dari receipt transaksi
 * `settle` (event `Pulled` / `Refunded`) + urutan `membersOf`. Status sengaja TIDAK ikut
 * di-hash: invoice "due" menjadi "paid" setelah `DebtPaid` tanpa mengubah `invoiceHash`.
 * Rincian pemakaian (judul, bagian) ditampilkan dari Envio + metadata, bukan bagian dari hash.
 */
export interface InvoiceSettlement {
  chainId: number;
  groupId: bigint;
  /** Posisi anggota di `membersOf(groupId)`, mulai 1. */
  index: number;
  member: string;
  settleTxHash: string;
  /** AUSD (6 desimal) yang ditarik dari anggota saat settle. */
  pulled: bigint;
  /** AUSD yang dikembalikan ke anggota saat settle. */
  refunded: bigint;
  remainingDebt: bigint;
  remainingCredit: bigint;
}

/** `INV-{trip}-{urutan}`, mis. `INV-12-003`. */
export function invoiceNumber(groupId: bigint, index: number): string {
  return `INV-${groupId.toString()}-${String(index).padStart(3, "0")}`;
}

/** JSON kanonik yang di-hash. Semua nominal ditulis sebagai string desimal unit terkecil. */
export function buildInvoicePayload(s: InvoiceSettlement): string {
  return canonicalJson({
    v: 1,
    number: invoiceNumber(s.groupId, s.index),
    chainId: s.chainId,
    groupId: s.groupId.toString(),
    member: s.member.toLowerCase(),
    settleTxHash: s.settleTxHash.toLowerCase(),
    pulled: s.pulled.toString(),
    refunded: s.refunded.toString(),
    remainingDebt: s.remainingDebt.toString(),
    remainingCredit: s.remainingCredit.toString(),
  });
}

export function computeInvoiceHash(payload: string): Hex {
  return keccak256(toBytes(payload));
}

/** Status saat invoice dibuat: Refunded (menerima kembalian), Due (masih ada debt), selain itu Paid. */
export function initialInvoiceStatus(s: Pick<InvoiceSettlement, "refunded" | "remainingDebt">): InvoiceStatus {
  if (s.remainingDebt > 0n) return "due";
  if (s.refunded > 0n) return "refunded";
  return "paid";
}
