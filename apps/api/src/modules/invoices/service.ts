import { jwtVerify, SignJWT } from "jose";
import type { Hash } from "viem";
import {
  buildInvoicePayload,
  computeInvoiceHash,
  initialInvoiceStatus,
  invoiceNumber,
  invoiceSettlementsFromOutcome,
} from "@tekosue/shared";
import type { AppDeps } from "../../context";
import type { InvoiceRow, NewInvoice } from "../../db/repos";
import { checksumAddress } from "../../lib/address";

/** Share links for the web verification page (docs/03: "link berbagi memakai token yang kedaluwarsa"). */
const SHARE_AUDIENCE = "tekosue:invoice-share";
const SHARE_TTL_SECONDS = 7 * 24 * 60 * 60;

export type EnsureInvoicesResult =
  | { status: "created"; created: number; txHash: string }
  | { status: "exists" }
  | { status: "not_settled" };

/**
 * FR-12 / FR-22: one invoice per member, built from the settle transaction itself
 * (Pulled / Refunded events) so anyone can recompute invoiceHash from the chain.
 * Idempotent: rows are insert-only and keyed by (group, member) and number.
 *
 * `txHash` is known when our settler sent the transaction; otherwise (a member settled,
 * or a backfill) the Settled transaction is looked up through Envio.
 */
export async function ensureInvoices(
  ctx: AppDeps,
  groupId: bigint,
  txHash?: string | null,
): Promise<EnsureInvoicesResult> {
  const id = Number(groupId);
  if ((await ctx.repos.invoices.countByGroup(id)) > 0) return { status: "exists" };

  const settleTx = txHash ?? (await ctx.envio.settleTxHash(groupId.toString()));
  if (!settleTx) return { status: "not_settled" };

  const outcome = await ctx.chain.getSettleOutcome(groupId, settleTx as Hash);
  if (!outcome) return { status: "not_settled" };

  const members = await ctx.chain.membersOf(groupId);
  // Same mapping the web verification page uses (from Envio), so both build identical payloads.
  const settlements = invoiceSettlementsFromOutcome({ chainId: ctx.env.CHAIN_ID, groupId, members, outcome });
  const rows: NewInvoice[] = settlements.map((settlement) => {
    const payload = buildInvoicePayload(settlement);
    return {
      groupId: id,
      member: settlement.member,
      number: invoiceNumber(groupId, settlement.index),
      status: initialInvoiceStatus(settlement),
      invoiceHash: computeInvoiceHash(payload),
      payload,
      remainingDebt: settlement.remainingDebt.toString(),
    };
  });

  const created = await ctx.repos.invoices.insertMany(rows);
  ctx.logger.info({ groupId: groupId.toString(), created, txHash: outcome.txHash }, "invoices created");
  return { status: "created", created, txHash: outcome.txHash };
}

/**
 * Safety net for invoices that could not be written right after settle (DB or RPC hiccup):
 * recent confirmed/skipped settle runs without invoices are retried on every sweep.
 */
export async function backfillInvoices(ctx: AppDeps, limit = 50): Promise<void> {
  const runs = await ctx.repos.settleRuns.listRecent(limit);
  for (const run of runs) {
    if (run.status !== "confirmed" && run.status !== "skipped") continue;
    try {
      await ensureInvoices(ctx, BigInt(run.groupId), run.txHash);
    } catch (error) {
      ctx.logger.warn({ err: error, groupId: run.groupId }, "invoice backfill failed");
    }
  }
}

export function serializeInvoice(row: InvoiceRow) {
  return {
    number: row.number,
    groupId: String(row.groupId),
    member: checksumAddress(row.member),
    status: row.status,
    invoiceHash: row.invoiceHash,
    /** Exactly the bytes that were hashed; parse it to read the amounts (decimal strings, 6 decimals). */
    payload: row.payload,
    debtPaid: row.debtPaid,
    issuedAt: row.issuedAt.toISOString(),
  };
}

export async function createShareToken(ctx: AppDeps, number: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(number)
    .setAudience(SHARE_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SHARE_TTL_SECONDS}s`)
    .sign(new TextEncoder().encode(ctx.env.AUTH_JWT_SECRET));
}

/** True when the token was issued for exactly this invoice number and has not expired. */
export async function verifyShareToken(ctx: AppDeps, number: string, token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(ctx.env.AUTH_JWT_SECRET), {
      algorithms: ["HS256"],
      audience: SHARE_AUDIENCE,
    });
    return payload.sub === number;
  } catch {
    return false;
  }
}
