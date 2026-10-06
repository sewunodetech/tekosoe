import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildInvoicePayload,
  computeInvoiceHash,
  invoiceNumber,
  type InvoiceSettlement,
} from "@tekosue/shared";
import { envioUrl } from "@/lib/site";
import type { SharedInvoice } from "./api";
import type { EnvioSettleRecord } from "./envio";
import { chainSettleFromRecord, decideVerification, loadVerification, type ApiSide, type ChainSettle } from "./verify";

const uint = fc.bigInt({ min: 0n, max: (1n << 128n) - 1n });
const hex = (bytes: number) =>
  fc.uint8Array({ minLength: bytes, maxLength: bytes }).map((b) => `0x${Buffer.from(b).toString("hex")}`);

const settlementArb: fc.Arbitrary<InvoiceSettlement> = fc.record({
  chainId: fc.constant(10143),
  groupId: fc.bigInt({ min: 0n, max: 10n ** 9n }),
  index: fc.integer({ min: 1, max: 10 }),
  member: hex(20),
  settleTxHash: hex(32),
  pulled: uint,
  refunded: uint,
  remainingDebt: uint,
  remainingCredit: uint,
});

function sharedFor(s: InvoiceSettlement, upper = false): SharedInvoice {
  const payload = buildInvoicePayload(s);
  const hash = computeInvoiceHash(payload);
  return {
    number: invoiceNumber(s.groupId, s.index),
    groupId: s.groupId.toString(),
    member: s.member,
    status: "paid",
    invoiceHash: (upper ? `0x${hash.slice(2).toUpperCase()}` : hash) as `0x${string}`,
    payload,
    issuedAt: "2026-10-06T00:00:00.000Z",
  };
}

const ok = (s: InvoiceSettlement, debtNow = s.remainingDebt): ChainSettle => ({ kind: "ok", settlement: s, debtNow });

describe("decideVerification", () => {
  // Feature: tekosue-rebrand-live-web, Property 8: Cocok jika dan hanya jika identik; angka selalu dari data on-chain
  it("matches identical invoices and takes every number from the chain", () => {
    fc.assert(
      fc.property(settlementArb, fc.boolean(), fc.string({ minLength: 1 }), (s, upper, key) => {
        const invoice = sharedFor(s, upper);
        // Angka di invoice api sengaja diganti: ringkasan tetap harus dari chain.
        const result = decideVerification({ number: invoice.number, accessKey: key, api: { kind: "ok", invoice }, chain: ok(s) });
        expect(result.kind).toBe("match");
        if (result.kind !== "match") return;
        expect(result.summary).toMatchObject({
          number: invoice.number,
          pulled: s.pulled,
          refunded: s.refunded,
          remainingDebt: s.remainingDebt,
          remainingCredit: s.remainingCredit,
        });
      }),
      { numRuns: 100 },
    );
  });

  it("reports a mismatch for any single change", () => {
    type Mutation = (s: InvoiceSettlement, inv: SharedInvoice) => { s: InvoiceSettlement; inv: SharedInvoice };
    const mutations: Mutation[] = [
      (s, inv) => ({ s: { ...s, pulled: s.pulled + 1n }, inv }),
      (s, inv) => ({ s: { ...s, refunded: s.refunded + 1n }, inv }),
      (s, inv) => ({ s: { ...s, remainingDebt: s.remainingDebt + 1n }, inv }),
      (s, inv) => ({ s: { ...s, remainingCredit: s.remainingCredit + 1n }, inv }),
      (s, inv) => ({ s: { ...s, member: `0x${"1".repeat(40)}` === s.member ? `0x${"2".repeat(40)}` : `0x${"1".repeat(40)}` }, inv }),
      (s, inv) => ({ s: { ...s, settleTxHash: `${s.settleTxHash.slice(0, -1)}${s.settleTxHash.endsWith("0") ? "1" : "0"}` }, inv }),
      (s, inv) => ({ s: { ...s, chainId: s.chainId + 1 }, inv }),
      (s, inv) => ({ s: { ...s, index: s.index + 1 }, inv }),
      (s, inv) => ({ s, inv: { ...inv, invoiceHash: `${inv.invoiceHash.slice(0, -1)}${inv.invoiceHash.endsWith("0") ? "1" : "0"}` as `0x${string}` } }),
      (s, inv) => ({ s, inv: { ...inv, number: `${inv.number}0` } }),
    ];
    fc.assert(
      fc.property(settlementArb, fc.nat({ max: mutations.length - 1 }), (original, i) => {
        const { s, inv } = mutations[i]!(original, sharedFor(original));
        const number = invoiceNumber(original.groupId, original.index);
        expect(decideVerification({ number, accessKey: "k", api: { kind: "ok", invoice: inv }, chain: ok(s) }).kind).toBe("mismatch");
      }),
      { numRuns: 100 },
    );
  });

  it("marks a paid-off due invoice as paid", () => {
    const s: InvoiceSettlement = { chainId: 10143, groupId: 3n, index: 1, member: `0x${"a".repeat(40)}`, settleTxHash: `0x${"b".repeat(64)}`, pulled: 5n, refunded: 0n, remainingDebt: 2n, remainingCredit: 0n };
    const inv = sharedFor(s);
    const due = decideVerification({ number: inv.number, accessKey: "k", api: { kind: "ok", invoice: inv }, chain: ok(s, 2n) });
    const paid = decideVerification({ number: inv.number, accessKey: "k", api: { kind: "ok", invoice: inv }, chain: ok(s, 0n) });
    expect(due.kind === "match" && due.summary.status).toBe("due");
    expect(paid.kind === "match" && paid.summary.status).toBe("paid");
  });

  // Feature: tekosue-rebrand-live-web, Property 9: "Cocok" hanya muncul dengan input lengkap dan valid
  it("only matches with complete, valid input", () => {
    const s: InvoiceSettlement = { chainId: 10143, groupId: 3n, index: 2, member: `0x${"a".repeat(40)}`, settleTxHash: `0x${"b".repeat(64)}`, pulled: 0n, refunded: 7n, remainingDebt: 0n, remainingCredit: 0n };
    const good = sharedFor(s);
    const numberArb = fc.constantFrom(good.number, "INV-3-02", "nope", "");
    const keyArb = fc.constantFrom<string | null>("k", "", null);
    const apiArb = fc.constantFrom<ApiSide | null>(null, { kind: "ok", invoice: good }, { kind: "invalid" }, { kind: "unreachable" });
    const chainArb = fc.constantFrom<ChainSettle | null>(null, ok(s), { kind: "unavailable" });
    fc.assert(
      fc.property(numberArb, keyArb, apiArb, chainArb, (number, accessKey, api, chain) => {
        const kind = decideVerification({ number, accessKey, api, chain }).kind;
        const validNumber = /^INV-\d+-\d{3,}$/.test(number);
        if (!validNumber || !accessKey || api?.kind === "invalid") expect(kind).toBe("invalid-link");
        else if (!api || !chain) expect(kind).toBe("loading");
        else if (api.kind === "unreachable" || chain.kind === "unavailable") expect(kind).toBe("unavailable");
        if (kind === "match") {
          expect([validNumber, !!accessKey, api?.kind, chain?.kind]).toEqual([true, true, "ok", "ok"]);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("chainSettleFromRecord", () => {
  const TX = `0x${"c".repeat(64)}`;
  const A = `0x${"a".repeat(40)}`;
  const B = `0x${"b".repeat(40)}`;
  const record = (over: Partial<EnvioSettleRecord> = {}): EnvioSettleRecord => ({
    Group: [{ id: "4", status: "Settled", settleTxHash: TX }],
    Member: [
      { address: B, position: 2, debt: "0" },
      { address: A, position: 1, debt: "3" },
    ],
    Activity: [
      { id: `${TX}-5`, type: "Pulled", actor: A, amount: "10", remaining: "3", txHash: TX },
      { id: `${TX}-6`, type: "Refunded", actor: B, amount: "8", remaining: "0", txHash: TX },
      { id: `0x${"d".repeat(64)}-1`, type: "Refunded", actor: B, amount: "99", remaining: null, txHash: `0x${"d".repeat(64)}` },
    ],
    ...over,
  });

  it("rebuilds each member's settlement in membersOf order", () => {
    const first = chainSettleFromRecord(4n, 1, record());
    const second = chainSettleFromRecord(4n, 2, record());
    expect(first).toMatchObject({ kind: "ok", debtNow: 3n, settlement: { index: 1, member: A, pulled: 10n, remainingDebt: 3n, chainId: 10143 } });
    expect(second).toMatchObject({ kind: "ok", settlement: { index: 2, member: B, refunded: 8n, remainingCredit: 0n } });
  });

  it.each<[string, Partial<EnvioSettleRecord>, number]>([
    ["group missing", { Group: [] }, 1],
    ["not settled yet", { Group: [{ id: "4", status: "Active", settleTxHash: null }] }, 1],
    ["position not indexed", { Member: [{ address: A, position: null, debt: "0" }] }, 1],
    ["position gap", { Member: [{ address: A, position: 1, debt: "0" }, { address: B, position: 3, debt: "0" }] }, 1],
    ["index out of range", {}, 3],
    ["remaining not indexed", { Activity: [{ id: `${TX}-5`, type: "Pulled", actor: A, amount: "10", remaining: null, txHash: TX }] }, 1],
  ])("is unavailable when %s", (_, over, index) => {
    expect(chainSettleFromRecord(4n, index, record(over))).toEqual({ kind: "unavailable" });
  });
});

describe("loadVerification", () => {
  type Reply = { status: number; body?: unknown } | "network";
  function stubFetch(envio: Reply, api: Reply) {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      calls.push(url);
      const reply = url.startsWith(envioUrl) ? envio : api;
      if (reply === "network") throw new TypeError("fetch failed");
      return new Response(reply.body === undefined ? "" : JSON.stringify(reply.body), { status: reply.status });
    });
    return calls;
  }
  afterEach(() => vi.unstubAllGlobals());

  const TX = `0x${"c".repeat(64)}`;
  const A = `0x${"a".repeat(40)}`;
  const envioRecord = {
    data: {
      Group: [{ id: "4", status: "Settled", settleTxHash: TX }],
      Member: [{ address: A, position: 1, debt: "0" }],
      Activity: [{ id: `${TX}-5`, type: "Refunded", actor: A, amount: "12500000", remaining: "0", txHash: TX }],
    },
  };
  const settlement: InvoiceSettlement = { chainId: 10143, groupId: 4n, index: 1, member: A, settleTxHash: TX, pulled: 0n, refunded: 12_500_000n, remainingDebt: 0n, remainingCredit: 0n };
  const invoice = sharedFor(settlement);

  it("matches a real invoice end to end", async () => {
    const calls = stubFetch({ status: 200, body: envioRecord }, { status: 200, body: invoice });
    const result = await loadVerification("INV-4-001", "k+/=&#");
    expect(result.kind).toBe("match");
    expect(calls.some((u) => u.includes("/api/invoices/INV-4-001?token=k%2B%2F%3D%26%23"))).toBe(true);
  });

  it("reports a changed invoice", async () => {
    stubFetch({ status: 200, body: envioRecord }, { status: 200, body: { ...invoice, payload: invoice.payload.replace("12500000", "99500000") } });
    expect((await loadVerification("INV-4-001", "k")).kind).toBe("mismatch");
  });

  it.each([null, ""])("does not fetch without an access key (%o)", async (key) => {
    const calls = stubFetch({ status: 200, body: envioRecord }, { status: 200, body: invoice });
    expect(await loadVerification("INV-4-001", key)).toEqual({ kind: "invalid-link" });
    expect(calls).toHaveLength(0);
  });

  it("does not fetch for an invalid number", async () => {
    const calls = stubFetch({ status: 200, body: envioRecord }, { status: 200, body: invoice });
    expect(await loadVerification("INV-4-1", "k")).toEqual({ kind: "invalid-link" });
    expect(calls).toHaveLength(0);
  });

  it.each([401, 404, 400])("treats api %i as an invalid link", async (status) => {
    stubFetch({ status: 200, body: envioRecord }, { status, body: { error: { code: "INVALID_SHARE_TOKEN" } } });
    expect(await loadVerification("INV-4-001", "k")).toEqual({ kind: "invalid-link" });
  });

  it.each<[string, Reply, Reply]>([
    ["api down", { status: 200, body: envioRecord }, { status: 503 }],
    ["api rate limited", { status: 200, body: envioRecord }, { status: 429 }],
    ["api offline", { status: 200, body: envioRecord }, "network"],
    ["Envio down", { status: 502 }, { status: 200, body: invoice }],
    ["Envio offline", "network", { status: 200, body: invoice }],
    ["Envio not resynced", { status: 200, body: { errors: [{ message: "field 'position' not found" }] } }, { status: 200, body: invoice }],
  ])("cannot check when %s", async (_, envio, api) => {
    stubFetch(envio, api);
    expect(await loadVerification("INV-4-001", "k")).toEqual({ kind: "unavailable" });
  });
});
