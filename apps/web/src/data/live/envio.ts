import { envioUrl } from "@/lib/site";
import { fetchJson, type FetchResult } from "./http";

/** Envio (Hasura) mengembalikan BigInt sebagai string desimal. */
type BigIntString = string;

export type EnvioGroupRow = {
  id: string;
  name: string;
  endsAt: BigIntString;
  approvalThreshold: BigIntString;
  pool: BigIntString;
  status: "Active" | "Settled";
  memberCount: number;
};

export type EnvioSettleRecord = {
  Group: { id: string; status: "Active" | "Settled"; settleTxHash: string | null }[];
  Member: { address: string; position: number | null; debt: BigIntString }[];
  Activity: { id: string; type: string; actor: string; amount: BigIntString | null; remaining: BigIntString | null; txHash: string }[];
};

const INVITE_TRIP = `query InviteTrip($id: String!) {
  Group(where: { id: { _eq: $id } }, limit: 1) {
    id name endsAt approvalThreshold pool status memberCount
  }
}`;

const SETTLE_RECORD = `query SettleRecord($id: String!) {
  Group(where: { id: { _eq: $id } }, limit: 1) { id status settleTxHash }
  Member(where: { group_id: { _eq: $id } }) { address position debt }
  Activity(where: { group_id: { _eq: $id }, type: { _in: ["Pulled", "Refunded"] } }) {
    id type actor amount remaining txHash
  }
}`;

/** Satu query GraphQL; `errors` dari Hasura (mis. kolom belum ada sebelum sinkron ulang) = tidak terjangkau. */
async function query<T>(source: string, variables: Record<string, unknown>): Promise<FetchResult<T>> {
  const res = await fetchJson<{ data?: T; errors?: unknown[] }>(envioUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: source, variables }),
  });
  if (!res.ok) return res;
  if (res.data.errors?.length || !res.data.data) return { ok: false, error: { kind: "unreachable" } };
  return { ok: true, data: res.data.data };
}

/** Data trip untuk halaman undangan; `null` di `data` = trip tidak ada di Envio. */
export async function getInviteTrip(groupId: string): Promise<FetchResult<EnvioGroupRow | null>> {
  const res = await query<{ Group: EnvioGroupRow[] }>(INVITE_TRIP, { id: groupId });
  return res.ok ? { ok: true, data: res.data.Group[0] ?? null } : res;
}

/** Hasil settle grup (status, tx settle, anggota berurutan, event Pulled/Refunded). */
export function getSettleRecord(groupId: string): Promise<FetchResult<EnvioSettleRecord>> {
  return query<EnvioSettleRecord>(SETTLE_RECORD, { id: groupId });
}

/** "123" → 123n; null kalau bukan bilangan bulat desimal. */
export function parseBigInt(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^-?\d+$/.test(value)) return null;
  return BigInt(value);
}
