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
