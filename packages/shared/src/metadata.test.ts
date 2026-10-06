import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildInvoicePayload,
  computeInvoiceHash,
  computeNoteHash,
  initialInvoiceStatus,
  invoiceNumber,
  invoiceSettlementsFromOutcome,
  parseInvoiceNumber,
  settleOutcomeFromActivities,
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

test("parseInvoiceNumber", () => {
  assert.deepEqual(parseInvoiceNumber("INV-12-003"), { groupId: 12n, index: 3 });
  assert.deepEqual(parseInvoiceNumber("INV-0012-0100"), { groupId: 12n, index: 100 });
  for (const bad of ["INV-12-03", "INV-12-000", "inv-12-003", "INV--003", "INV-12-003 ", "INV-1a-003"]) {
    assert.equal(parseInvoiceNumber(bad), null, bad);
  }
  assert.equal(parseInvoiceNumber(invoiceNumber(7n, 2))?.index, 2);
});

test("settleOutcomeFromActivities hanya membaca tx settle, urut logIndex, entri terakhir menang", () => {
  const tx = `0x${"ab".repeat(32)}`;
  const other = `0x${"cd".repeat(32)}`;
  const A = "0xAAAAaaaaAAAAaaaaAAAAaaaaAAAAaaaaAAAAaaaa";
  const rows = [
    { id: `${tx}-10`, type: "Refunded", actor: A, amount: 5n, remaining: 1n, txHash: tx.toUpperCase().replace("0X", "0x") },
    { id: `${tx}-9`, type: "Refunded", actor: A, amount: 4n, remaining: 2n, txHash: tx },
    { id: `${other}-1`, type: "Refunded", actor: A, amount: 99n, remaining: 0n, txHash: other },
    { id: `${tx}-3`, type: "Pulled", actor: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", amount: 7n, remaining: 3n, txHash: tx },
    { id: `${tx}-4`, type: "Settled", actor: A, amount: 0n, remaining: 0n, txHash: tx },
  ];
  const outcome = settleOutcomeFromActivities(tx, rows);
  assert.deepEqual(outcome.refunded.get(A.toLowerCase()), { amount: 5n, remainingCredit: 1n });
  assert.deepEqual(outcome.pulled.get("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"), { amount: 7n, remainingDebt: 3n });
  assert.equal(outcome.pulled.size + outcome.refunded.size, 2);

  const [first, second, third] = invoiceSettlementsFromOutcome({
    chainId: 10143,
    groupId: 4n,
    members: [A, "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "0xcccccccccccccccccccccccccccccccccccccccc"],
    outcome,
  });
  assert.equal(first?.member, A.toLowerCase());
  assert.equal(first?.refunded, 5n);
  assert.equal(second?.index, 2);
  assert.equal(second?.remainingDebt, 3n);
  assert.deepEqual([third?.pulled, third?.refunded, third?.remainingDebt, third?.remainingCredit], [0n, 0n, 0n, 0n]);
});
