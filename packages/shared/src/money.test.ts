import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDollars, parseDollars, splitEqually } from "./money.ts";

test("parseDollars ↔ formatDollars", () => {
  assert.equal(parseDollars("12.5"), 12_500_000n);
  assert.equal(formatDollars(12_500_000n), "$12.50");
  assert.equal(formatDollars(1_234_567_890n), "$1,234.57");
  assert.throws(() => parseDollars("1.1234567"));
});

test("splitEqually menjaga jumlah == amount", () => {
  const shares = splitEqually(100_000_001n, 3);
  assert.equal(shares.reduce((a, b) => a + b, 0n), 100_000_001n);
});
