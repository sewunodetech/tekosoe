import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildInvoicePayload,
  computeInvoiceHash,
  computeNoteHash,
  initialInvoiceStatus,
  invoiceNumber,
} from "./metadata.ts";

const settlement = {
  chainId: 10143,
  groupId: 12n,
  index: 3,
  member: "0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD",
  settleTxHash: `0x${"AA".repeat(32)}`,
  pulled: 0n,
  refunded: 12_500_000n,
  remainingDebt: 0n,
  remainingCredit: 0n,
};

test("invoiceNumber memakai format INV-{trip}-{urutan}", () => {
  assert.equal(invoiceNumber(12n, 3), "INV-12-003");
});

test("payload invoice kanonik, lowercase, nominal sebagai string", () => {
  const payload = buildInvoicePayload(settlement);
  assert.equal(
    payload,
    `{"chainId":10143,"groupId":"12","member":"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd","number":"INV-12-003","pulled":"0","refunded":"12500000","remainingCredit":"0","remainingDebt":"0","settleTxHash":"0x${"aa".repeat(32)}","v":1}`,
  );
  assert.equal(computeInvoiceHash(payload), computeInvoiceHash(buildInvoicePayload({ ...settlement })));
});

test("status awal invoice", () => {
  assert.equal(initialInvoiceStatus({ refunded: 1n, remainingDebt: 0n }), "refunded");
  assert.equal(initialInvoiceStatus({ refunded: 0n, remainingDebt: 5n }), "due");
  assert.equal(initialInvoiceStatus({ refunded: 0n, remainingDebt: 0n }), "paid");
});

test("computeNoteHash tidak bergantung urutan kunci", () => {
  const a = computeNoteHash({ title: "Dinner", category: "food", note: "", receiptHash: null });
  const b = computeNoteHash({ receiptHash: null, note: "", category: "food", title: "Dinner" });
  assert.equal(a, b);
});
