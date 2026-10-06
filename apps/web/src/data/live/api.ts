import { apiUrl } from "@/lib/site";
import { ACCESS_PARAM } from "@/lib/verify-link";
import { fetchJson } from "./http";

/** Nama trip dari metadata publik api; null untuk 404 atau kegagalan apa pun (tidak pernah menggagalkan halaman). */
export async function getGroupName(groupId: string): Promise<string | null> {
  const res = await fetchJson<{ name?: unknown }>(`${apiUrl}/api/groups/${encodeURIComponent(groupId)}/meta`);
  return res.ok && typeof res.data.name === "string" ? res.data.name : null;
}

/** Bentuk `serializeInvoice` di apps/api (modules/invoices/service.ts). */
export type SharedInvoice = {
  number: string;
  groupId: string;
  member: string;
  status: "paid" | "refunded" | "due";
  invoiceHash: `0x${string}`;
  /** Byte persis yang di-hash. */
  payload: string;
  issuedAt: string;
};

export type SharedInvoiceResult =
  | { ok: true; invoice: SharedInvoice }
  /** 4xx: link salah, kedaluwarsa, atau invoice tidak ada. */
  | { ok: false; reason: "invalid" }
  /** Jaringan, timeout, 5xx, 429, atau respons tidak berbentuk invoice. */
  | { ok: false; reason: "unreachable" };

const isSharedInvoice = (v: unknown): v is SharedInvoice => {
  const o = v as Record<string, unknown> | null;
  return (
    !!o &&
    typeof o.number === "string" &&
    typeof o.payload === "string" &&
    typeof o.invoiceHash === "string" &&
    /^0x[0-9a-fA-F]{64}$/.test(o.invoiceHash) &&
    (o.status === "paid" || o.status === "refunded" || o.status === "due")
  );
};

export async function getSharedInvoice(number: string, accessKey: string): Promise<SharedInvoiceResult> {
  const url = `${apiUrl}/api/invoices/${encodeURIComponent(number)}?${ACCESS_PARAM}=${encodeURIComponent(accessKey)}`;
  const res = await fetchJson<unknown>(url);
  if (!res.ok) return { ok: false, reason: res.error.kind === "status" ? "invalid" : "unreachable" };
  return isSharedInvoice(res.data) ? { ok: true, invoice: res.data } : { ok: false, reason: "unreachable" };
}
