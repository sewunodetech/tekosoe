import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { parseInviteCode } from "./invite-code";
import { SITE_DOMAIN } from "./links";
import { segmentAfter } from "./shell-path";
import { verifyHref, verifyLabel } from "./verify-link";

const hexChar = fc.constantFrom(..."0123456789abcdefABCDEF".split(""));
const secret = fc.array(hexChar, { minLength: 64, maxLength: 64 }).map((c) => c.join(""));

describe("invite code", () => {
  it("uses the new domain", () => {
    expect(SITE_DOMAIN).toBe("tekosue.xyz");
  });

  // Feature: tekosue-rebrand-live-web, Property 1: Parse kode undangan — round trip dan penolakan
  it("round-trips the group id from an app invite URL and never returns the secret", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: 2n ** 64n }), secret, (groupId, s) => {
        const code = `${groupId}-${s}`;
        const parsed = parseInviteCode(segmentAfter(new URL(`https://tekosue.xyz/j/${code}`).pathname, "/j/"));
        expect(parsed).toEqual({ groupId: String(groupId) });
        expect(JSON.stringify(parsed).toLowerCase()).not.toContain(s.toLowerCase());
      }),
      { numRuns: 100 },
    );
  });

  it("rejects anything else", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 120 }), (s) => {
        fc.pre(!/^\d+-[0-9a-fA-F]{64}$/.test(s));
        expect(parseInviteCode(s)).toBeNull();
      }),
      { numRuns: 100 },
    );
    expect(parseInviteCode(`12-${"a".repeat(63)}`)).toBeNull();
    expect(parseInviteCode(`japan`)).toBeNull();
    expect(parseInviteCode(`007-${"F".repeat(64)}`)).toEqual({ groupId: "7" });
  });
});

describe("verify link", () => {
  const number = fc.tuple(fc.nat({ max: 10_000 }), fc.integer({ min: 1, max: 9999 })).map(([g, i]) => `INV-${g}-${String(i).padStart(3, "0")}`);

  // Feature: tekosue-rebrand-live-web, Property 6: URL verifikasi — round trip token
  it("carries the access key exactly and keeps it out of the visible label", () => {
    fc.assert(
      fc.property(number, fc.string({ minLength: 1, maxLength: 60 }), (n, key) => {
        const url = new URL(verifyHref(n, key));
        expect(url.host).toBe("tekosue.xyz");
        expect(url.pathname).toBe(`/v/${n}`);
        expect(url.searchParams.get("token")).toBe(key);
        const label = verifyLabel(n);
        expect(label).toBe(`tekosue.xyz/v/${n}`);
        expect(label).not.toMatch(/token|\?/i);
      }),
      { numRuns: 100 },
    );
  });

  it("has no query without an access key", () => {
    for (const key of [undefined, null, ""]) expect(verifyHref("INV-1-001", key)).toBe("https://tekosue.xyz/v/INV-1-001");
  });
});
