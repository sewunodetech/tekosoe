import {
  buildInvoicePayload,
  computeInvoiceHash,
  initialInvoiceStatus,
  invoiceSettlementsFromOutcome,
  MONAD_TESTNET_CHAIN_ID,
  parseInvoiceNumber,
  settleOutcomeFromActivities,
  type InvoiceSettlement,
  type SettleActivityRow,
} from "@tekosue/shared";
import { getSharedInvoice, type SharedInvoice } from "./api";
import { getSettleRecord, parseBigInt, type EnvioSettleRecord } from "./envio";

/** Hasil settle satu anggota, dibangun ulang dari Envio. */
export type ChainSettle =
  | { kind: "ok"; settlement: InvoiceSettlement; debtNow: bigint }
  /** Envio gagal, grup belum settle/terindeks, kolom baru kosong, posisi bolong, atau urutan di luar jangkauan. */
  | { kind: "unavailable" };

export type ApiSide = { kind: "ok"; invoice: SharedInvoice } | { kind: "invalid" } | { kind: "unreachable" };

export type VerifySummary = {
  number: string;
  status: "paid" | "refunded" | "due";
  pulled: bigint;
  refunded: bigint;
  remainingDebt: bigint;
  remainingCredit: bigint;
};

export type VerifyResult =
  | { kind: "loading" }
  | { kind: "invalid-link" }
  | { kind: "unavailable" }
  | { kind: "mismatch" }
  | { kind: "match"; summary: VerifySummary };

/**
 * Murni. Tidak pernah "match" kecuali kedua sisi lengkap, payload identik, dan sidik jari sama.
 * Angka ringkasan selalu dari data on-chain; invoice dari api hanya pembanding.
 */
export function decideVerification(input: {
  number: string;
  accessKey: string | null;
  /** null = masih memuat. */
  api: ApiSide | null;
  chain: ChainSettle | null;
}): VerifyResult {
  const { number, accessKey, api, chain } = input;
  if (!parseInvoiceNumber(number) || !accessKey) return { kind: "invalid-link" };
  if (api?.kind === "invalid") return { kind: "invalid-link" };
  if (!api || !chain) return { kind: "loading" };
  if (api.kind === "unreachable" || chain.kind === "unavailable") return { kind: "unavailable" };

  const s = chain.settlement;
  const rebuilt = buildInvoicePayload(s);
  const same =
    rebuilt === api.invoice.payload &&
    computeInvoiceHash(rebuilt).toLowerCase() === api.invoice.invoiceHash.toLowerCase() &&
    api.invoice.number === number;
  if (!same) return { kind: "mismatch" };

  const initial = initialInvoiceStatus(s);
  return {
    kind: "match",
    summary: {
      number,
      // Sama dengan app: invoice "due" jadi "paid" setelah utangnya dibayar.
      status: initial === "due" && chain.debtNow === 0n ? "paid" : initial,
      pulled: s.pulled,
      refunded: s.refunded,
      remainingDebt: s.remainingDebt,
      remainingCredit: s.remainingCredit,
    },
  };
}

/** Rekaman settle Envio → hasil settle anggota ke-`index`. Murni. */
export function chainSettleFromRecord(groupId: bigint, index: number, record: EnvioSettleRecord): ChainSettle {
  const unavailable = { kind: "unavailable" } as const;
  const group = record.Group[0];
  if (!group || group.status !== "Settled" || !group.settleTxHash) return unavailable;

  // Urutan membersOf: posisi harus tepat 1..n.
  const members = [...record.Member].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  if (members.some((m, i) => m.position !== i + 1)) return unavailable;
  const target = members[index - 1];
  if (!target) return unavailable;
  const debtNow = parseBigInt(target.debt);
  if (debtNow === null) return unavailable;

  const rows: SettleActivityRow[] = [];
  for (const a of record.Activity) {
    if (a.txHash.toLowerCase() !== group.settleTxHash.toLowerCase()) continue;
    const amount = parseBigInt(a.amount);
    const remaining = parseBigInt(a.remaining);
    if (amount === null || remaining === null) return unavailable;
    rows.push({ id: a.id, type: a.type, actor: a.actor, amount, remaining, txHash: a.txHash });
  }

  const outcome = settleOutcomeFromActivities(group.settleTxHash, rows);
  const settlement = invoiceSettlementsFromOutcome({
    chainId: MONAD_TESTNET_CHAIN_ID,
    groupId,
    members: members.map((m) => m.address),
    outcome,
  })[index - 1];
  return settlement ? { kind: "ok", settlement, debtNow } : unavailable;
}

/** Memuat kedua sisi secara paralel. Tanpa fetch kalau nomor atau kode akses tidak valid. */
export async function loadVerification(number: string, accessKey: string | null): Promise<VerifyResult> {
  const parsed = parseInvoiceNumber(number);
  if (!parsed || !accessKey) return { kind: "invalid-link" };

  const [shared, record] = await Promise.all([getSharedInvoice(number, accessKey), getSettleRecord(parsed.groupId.toString())]);
  const api: ApiSide = shared.ok ? { kind: "ok", invoice: shared.invoice } : { kind: shared.reason };
  const chain: ChainSettle = record.ok ? chainSettleFromRecord(parsed.groupId, parsed.index, record.data) : { kind: "unavailable" };
  return decideVerification({ number, accessKey, api, chain });
}
