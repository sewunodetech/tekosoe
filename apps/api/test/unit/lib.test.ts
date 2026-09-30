import { describe, expect, it } from "vitest";
import { isApiError } from "../../src/lib/errors";
import { checksumAddress, isAddressLike, normalizeAddress } from "../../src/lib/address";
import { formatAusd, parseAusd, parseMonAmount, weiToMon } from "../../src/lib/money";

describe("formatAusd", () => {
  it("writes 6-decimal units as dollars with cents", () => {
    expect(formatAusd(12_500_000n)).toBe("$12.50");
    expect(formatAusd(0n)).toBe("$0.00");
    expect(formatAusd(1_234_567_890n)).toBe("$1,234.57");
    expect(formatAusd(1_000_000_000_000n)).toBe("$1,000,000.00");
  });

  it("rounds sub-cent amounts and keeps the sign readable", () => {
    expect(formatAusd(1n)).toBe("$0.00");
    expect(formatAusd(4_999n)).toBe("$0.00");
    expect(formatAusd(5_000n)).toBe("$0.01");
    expect(formatAusd(-5_000_000n)).toBe("−$5.00");
  });

  it("parses dollars back to the smallest unit and rejects noise", () => {
    expect(parseAusd("12.50")).toBe(12_500_000n);
    expect(parseAusd("7")).toBe(7_000_000n);
    expect(() => parseAusd("12.1234567")).toThrow();
    expect(() => parseAusd("abc")).toThrow();
  });

  it("converts MON amounts only for operational output", () => {
    expect(parseMonAmount(0.05)).toBe(50_000_000_000_000_000n);
    expect(weiToMon(1_500_000_000_000_000_000n)).toBe(1.5);
  });
});

describe("address helpers", () => {
  const mixed = "0xab580167f20b2e0e26b3d7a0f1a47e41c0e1a3f9";

  it("normalises to lowercase for storage", () => {
    expect(normalizeAddress(mixed.toUpperCase().replace("0X", "0x"))).toBe(mixed);
    expect(normalizeAddress(mixed)).toBe(mixed);
  });

  it("checksums for output and is stable across calls", () => {
    const checksummed = checksumAddress(mixed);
    expect(checksummed).toBe(checksumAddress(checksummed));
    expect(normalizeAddress(checksummed)).toBe(mixed);
  });

  it("rejects anything that is not a 0x address with the standard envelope", () => {
    expect(isAddressLike("0x123")).toBe(false);
    expect(isAddressLike(42)).toBe(false);
    try {
      normalizeAddress("not-an-address");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      if (isApiError(error)) {
        expect(error.status).toBe(400);
        expect(error.code).toBe("INVALID_ADDRESS");
      }
    }
  });
});
