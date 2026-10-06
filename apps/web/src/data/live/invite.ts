import { parseInviteCode } from "@/lib/invite-code";
import { getGroupName } from "./api";
import { getInviteTrip, parseBigInt, type EnvioGroupRow } from "./envio";

export type InviteTrip = {
  name: string;
  memberCount: number;
  /** Detik unix. */
  endsAt: number;
  /** AUSD (6 desimal). */
  pot: bigint;
  approvalLimit: bigint;
  settled: boolean;
};

export type InviteResult =
  | { kind: "invalid" }
  | { kind: "not-found" }
  /** Data trip tidak bisa dimuat sekarang: tampilkan undangan generik. */
  | { kind: "generic" }
  | { kind: "found"; trip: InviteTrip };

export const GENERIC_TRIP_NAME = "a shared trip pot";

/** Nama dari api (yang diisi pembuat trip) → nama on-chain → label generik. Tidak pernah kosong. */
export function pickTripName(apiName: string | null, chainName: string | null): string {
  return apiName?.trim() || chainName?.trim() || GENERIC_TRIP_NAME;
}

/** Baris Group Envio → InviteTrip; null kalau angka tidak bisa dibaca. */
export function toInviteTrip(row: EnvioGroupRow, apiName: string | null): InviteTrip | null {
  const endsAt = parseBigInt(row.endsAt);
  const pot = parseBigInt(row.pool);
  const approvalLimit = parseBigInt(row.approvalThreshold);
  if (endsAt === null || pot === null || approvalLimit === null) return null;
  return {
    name: pickTripName(apiName, row.name),
    memberCount: row.memberCount,
    endsAt: Number(endsAt),
    pot,
    approvalLimit,
    settled: row.status === "Settled",
  };
}

/**
 * Data halaman undangan. Hanya `groupId` yang dikirim ke Envio dan api; rahasia undangan tetap di browser.
 * Api gagal tidak pernah menggagalkan hasil (nama dari Envio).
 */
export async function loadInvite(code: string): Promise<InviteResult> {
  const parsed = parseInviteCode(code);
  if (!parsed) return { kind: "invalid" };

  const [trip, apiName] = await Promise.all([getInviteTrip(parsed.groupId), getGroupName(parsed.groupId)]);
  if (!trip.ok) return { kind: "generic" };
  if (!trip.data) return { kind: "not-found" };
  const mapped = toInviteTrip(trip.data, apiName);
  return mapped ? { kind: "found", trip: mapped } : { kind: "generic" };
}
