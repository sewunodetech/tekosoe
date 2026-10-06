import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { encodeAbiParameters, encodeEventTopics, type Hash, type Log } from "viem";
import {
  buildInvoicePayload,
  computeInvoiceHash,
  groupVaultAbi,
  invoiceSettlementsFromOutcome,
  settleOutcomeFromActivities,
  type InvoiceSettlement,
  type SettleActivityRow,
} from "@tekosue/shared";
import { settleOutcomeFromLogs, type SettleOutcome } from "../../src/chain/groupVault";

const CHAIN_ID = 10143;
const GROUP_ID = 7n;
const uint = fc.bigInt({ min: 0n, max: (1n << 128n) - 1n });
const hex = (bytes: number) =>
  fc.uint8Array({ minLength: bytes, maxLength: bytes }).map((b) => `0x${Buffer.from(b).toString("hex")}`);
const randomCase = (s: string, mask: boolean[]) =>
  `0x${[...s.slice(2)].map((c, i) => (mask[i % mask.length] ? c.toUpperCase() : c)).join("")}`;

function log(eventName: "Settled" | "Pulled" | "Refunded", args: Record<string, unknown>, values: bigint[]): Log {
  return {
    address: "0x9999999999999999999999999999999999999999",
    topics: encodeEventTopics({ abi: groupVaultAbi, eventName, args } as never),
    data: encodeAbiParameters(
      values.map(() => ({ type: "uint256" })),
      values,
    ),
    blockHash: null,
    blockNumber: null,
    logIndex: null,
    transactionHash: null,
    transactionIndex: null,
    removed: false,
  } as unknown as Log;
}

/** ensureInvoices before the refactor, kept verbatim as the reference. */
function legacySettlements(members: string[], outcome: SettleOutcome): InvoiceSettlement[] {
  return members.map((address, position) => {
    const member = address.toLowerCase();
    const pulled = outcome.pulled.get(member);
    const refunded = outcome.refunded.get(member);
    return {
      chainId: CHAIN_ID,
      groupId: GROUP_ID,
      index: position + 1,
      member,
      settleTxHash: outcome.txHash,
      pulled: pulled?.amount ?? 0n,
      refunded: refunded?.amount ?? 0n,
      remainingDebt: pulled?.remainingDebt ?? 0n,
      remainingCredit: refunded?.remainingCredit ?? 0n,
    };
  });
}

const payloads = (settlements: InvoiceSettlement[]) =>
  settlements.map((s) => {
    const payload = buildInvoicePayload(s);
    return [payload, computeInvoiceHash(payload)];
  });

describe("settle mapping", () => {
  // Feature: tekosue-rebrand-live-web, Property 7: Jalur Envio dan jalur api menghasilkan payload identik
  it("Envio activities and the settle receipt build identical invoice payloads", () => {
    const scenario = fc
      .uniqueArray(hex(20), { minLength: 1, maxLength: 10 })
      .chain((members) =>
        fc.record({
          members: fc.constant(members),
          txHash: hex(32),
          events: fc.array(
            fc.record({
              member: fc.nat({ max: members.length - 1 }),
              type: fc.constantFrom("Pulled" as const, "Refunded" as const),
              amount: uint,
              remaining: uint,
            }),
            { maxLength: 15 },
          ),
          noise: fc.array(
            fc.record({ member: fc.nat({ max: members.length - 1 }), tx: hex(32), amount: uint, remaining: uint }),
            { maxLength: 4 },
          ),
          caseMask: fc.array(fc.boolean(), { minLength: 1, maxLength: 40 }),
          seed: fc.integer(),
        }),
      );

    fc.assert(
      fc.property(scenario, ({ members, txHash, events, noise, caseMask, seed }) => {
        const tx = txHash as Hash;
        // (a) receipt of the settle transaction: Settled, then Pulled/Refunded in log order.
        const logs = [
          log("Settled", { groupId: GROUP_ID }, [123n]),
          ...events.map((e) =>
            log(e.type, { groupId: GROUP_ID, member: members[e.member] }, [e.amount, e.remaining]),
          ),
        ];
        const fromLogs = settleOutcomeFromLogs(GROUP_ID, tx, logs)!;

        // (b) the same events as Envio Activity rows (logIndex 1 = Settled), shuffled, mixed-case
        // addresses, plus Refunded/Pulled rows from other transactions (payDebt / claimCredit).
        const rows: SettleActivityRow[] = [
          ...events.map((e, i) => ({
            id: `${txHash}-${i + 1}`,
            type: e.type,
            actor: randomCase(members[e.member]!, caseMask),
            amount: e.amount,
            remaining: e.remaining,
            txHash,
          })),
          ...noise.map((n, i) => ({
            id: `${n.tx}-${i}`,
            type: i % 2 ? "Pulled" : "Refunded",
            actor: members[n.member]!,
            amount: n.amount,
            remaining: n.remaining,
            txHash: n.tx === txHash ? `${n.tx}00` : n.tx,
          })),
        ];
        let state = seed;
        const shuffled = rows
          .map((row) => ({ row, key: (state = (state * 1103515245 + 12345) | 0) }))
          .sort((a, b) => a.key - b.key)
          .map(({ row }) => row);
        const fromEnvio = settleOutcomeFromActivities(txHash, shuffled);

        const membersInput = members.map((m) => randomCase(m, caseMask));
        const viaApi = invoiceSettlementsFromOutcome({ chainId: CHAIN_ID, groupId: GROUP_ID, members: membersInput, outcome: fromLogs });
        const viaWeb = invoiceSettlementsFromOutcome({ chainId: CHAIN_ID, groupId: GROUP_ID, members: membersInput, outcome: fromEnvio });

        expect(payloads(viaWeb)).toEqual(payloads(viaApi));
        expect(payloads(viaApi)).toEqual(payloads(legacySettlements(membersInput, fromLogs)));
      }),
      { numRuns: 100 },
    );
  });
});
