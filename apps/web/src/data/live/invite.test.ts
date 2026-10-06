import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";
import { inviteFacts } from "@/lib/invite-facts";
import { money, moneyShort } from "@/lib/money";
import { apiUrl, envioUrl } from "@/lib/site";
import { GENERIC_TRIP_NAME, loadInvite, pickTripName, toInviteTrip } from "./invite";

type Reply = { status: number; body?: unknown } | "network" | "timeout";
const json = (status: number, body?: unknown): Reply => ({ status, body });

/** fetch palsu: catat setiap permintaan, jawab per tujuan (Envio / api). */
function stubFetch(envio: Reply, api: Reply) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    const reply = url.startsWith(envioUrl) ? envio : api;
    if (reply === "network") throw new TypeError("fetch failed");
    if (reply === "timeout") throw new DOMException("timed out", "TimeoutError");
    return new Response(reply.body === undefined ? "not json" : JSON.stringify(reply.body), { status: reply.status });
  });
  return calls;
}

const group = (over: Record<string, unknown> = {}) => ({
  id: "12",
  name: "Japan Trip",
  endsAt: "1791936000",
  approvalThreshold: "50000000",
  pool: "14000000",
  status: "Active",
  memberCount: 3,
  ...over,
});
const SECRET = "Ab".repeat(32);
const CODE = `12-${SECRET}`;

afterEach(() => vi.unstubAllGlobals());

describe("loadInvite", () => {
  it("shows the api name with the trip numbers from Envio", async () => {
    stubFetch(json(200, { data: { Group: [group()] } }), json(200, { name: " Tokyo crew " }));
    const result = await loadInvite(CODE);
    expect(result).toEqual({
      kind: "found",
      trip: { name: "Tokyo crew", memberCount: 3, endsAt: 1791936000, pot: 14_000_000n, approvalLimit: 50_000_000n, settled: false },
    });
  });

  it.each([json(404, { error: { code: "GROUP_META_NOT_FOUND" } }), json(503), "network" as const, "timeout" as const])(
    "falls back to the on-chain name when the api fails (%o)",
    async (api) => {
      stubFetch(json(200, { data: { Group: [group()] } }), api);
      const result = await loadInvite(CODE);
      expect(result.kind === "found" && result.trip.name).toBe("Japan Trip");
    },
  );

  it("reports a missing trip", async () => {
    stubFetch(json(200, { data: { Group: [] } }), json(404));
    expect(await loadInvite(CODE)).toEqual({ kind: "not-found" });
  });

  it.each([json(502), "network" as const, "timeout" as const, json(200, { errors: [{ message: "boom" }] }), json(200)])(
    "shows the generic invite when Envio is unreachable (%o)",
    async (envio) => {
      stubFetch(envio, json(200, { name: "x" }));
      expect(await loadInvite(CODE)).toEqual({ kind: "generic" });
    },
  );

  it("does not fetch for an invalid code", async () => {
    const calls = stubFetch(json(200, {}), json(200, {}));
    expect(await loadInvite("japan")).toEqual({ kind: "invalid" });
    expect(calls).toHaveLength(0);
  });

  // Feature: tekosue-rebrand-live-web, Property 2: Rahasia undangan tidak pernah keluar dari browser
  it("never sends the invite secret anywhere", async () => {
    const hex = fc.array(fc.constantFrom(..."0123456789abcdefABCDEF".split("")), { minLength: 64, maxLength: 64 }).map((c) => c.join(""));
    const reply = fc.constantFrom<Reply>(json(200, { data: { Group: [group()] } }), json(200, { name: "n" }), json(404), json(500), "network", "timeout");
    await fc.assert(
      fc.asyncProperty(fc.bigInt({ min: 0n, max: 10n ** 12n }), hex, reply, reply, async (groupId, secret, envio, api) => {
        const calls = stubFetch(envio, api);
        await loadInvite(`${groupId}-${secret}`);
        expect(calls.length).toBeGreaterThan(0);
        for (const { url, init } of calls) {
          const sent = `${url}\n${String(init.body ?? "")}\n${JSON.stringify(init.headers ?? {})}`.toLowerCase();
          expect(sent).not.toContain(secret.toLowerCase());
          expect(sent).toContain(String(groupId));
          expect(init.referrerPolicy).toBe("no-referrer");
          expect(init.credentials).toBe("omit");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("asks the api only for the group id", async () => {
    const calls = stubFetch(json(200, { data: { Group: [group()] } }), json(200, { name: "n" }));
    await loadInvite(CODE);
    expect(calls.map((c) => c.url)).toContain(`${apiUrl}/api/groups/12/meta`);
  });
});

describe("invite helpers", () => {
  // Feature: tekosue-rebrand-live-web, Property 3: Prioritas nama trip
  it("prefers the api name, then the on-chain name, then a generic label", () => {
    const name = fc.option(fc.string({ maxLength: 20 }), { nil: null });
    fc.assert(
      fc.property(name, name, (apiName, chainName) => {
        const expected = apiName?.trim() || chainName?.trim() || GENERIC_TRIP_NAME;
        const picked = pickTripName(apiName, chainName);
        expect(picked).toBe(expected);
        expect(picked).not.toBe("");
      }),
      { numRuns: 100 },
    );
  });

  // Feature: tekosue-rebrand-live-web, Property 4: Pemetaan data undangan dan nominal dolar
  it("maps Envio numbers exactly and shows them in dollars", () => {
    const amount = fc.bigInt({ min: 0n, max: 10n ** 15n });
    fc.assert(
      fc.property(amount, amount, fc.bigInt({ min: 0n, max: 4_000_000_000n }), fc.integer({ min: 1, max: 10 }), (pot, limit, endsAt, count) => {
        const trip = toInviteTrip(
          group({ pool: pot.toString(), approvalThreshold: limit.toString(), endsAt: endsAt.toString(), memberCount: count }) as never,
          null,
        )!;
        expect([trip.pot, trip.approvalLimit, BigInt(trip.endsAt), trip.memberCount]).toEqual([pot, limit, endsAt, count]);
        const facts = Object.fromEntries(inviteFacts(trip).map((f) => [f.label, f.value]));
        expect(facts["In the pot"]).toBe(money(pot));
        expect(facts.Approval).toBe(`Over ${moneyShort(limit)}`);
        expect(facts.Members).toBe(String(count));
      }),
      { numRuns: 100 },
    );
  });

  it("rejects unreadable numbers", () => {
    expect(toInviteTrip(group({ pool: "1.5" }) as never, null)).toBeNull();
  });
});
