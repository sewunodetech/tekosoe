import request from "supertest";
import { describe, expect, it } from "vitest";
import { createFakeChain, makeApp, TEST_ADDRESS, testEnv } from "../helpers/fakes";

/** The drip keeps active members able to pay: first funding, then refills only when nearly empty. */
describe("POST /api/drip", () => {
  const address = TEST_ADDRESS.toLowerCase();

  function setup(balanceWei: () => bigint) {
    let sends = 0;
    const built = makeApp({
      env: testEnv({ DRIP_REFILL_COOLDOWN_MINUTES: "30" }),
      chain: createFakeChain({
        getNativeBalance: async () => balanceWei(),
        sendDrip: async () => {
          sends += 1;
          return `0x${String(sends).padStart(64, "0")}` as `0x${string}`;
        },
      }),
    });
    return { ...built, sends: () => sends };
  }

  async function ageLastDrip(repos: ReturnType<typeof setup>["repos"], minutes: number) {
    const row = await repos.gasDrips.get(address);
    if (row) row.createdAt = new Date(Date.now() - minutes * 60_000);
  }

  it("funds a brand-new account once", async () => {
    const { app, sends } = setup(() => 0n);
    const first = await request(app).post("/api/drip").send({ address: TEST_ADDRESS });
    expect(first.body.status).toBe("funded");
    const second = await request(app).post("/api/drip").send({ address: TEST_ADDRESS });
    expect(second.body.status).toBe("already_funded");
    expect(sends()).toBe(1);
  });

  it("refills a nearly empty account after the cooldown", async () => {
    const { app, repos, sends } = setup(() => 0n);
    await request(app).post("/api/drip").send({ address: TEST_ADDRESS });
    await ageLastDrip(repos, 31);
    const refill = await request(app).post("/api/drip").send({ address: TEST_ADDRESS });
    expect(refill.body.status).toBe("funded");
    expect(sends()).toBe(2);
  });

  it("does not refill before the cooldown, even when empty", async () => {
    const { app, repos, sends } = setup(() => 0n);
    await request(app).post("/api/drip").send({ address: TEST_ADDRESS });
    await ageLastDrip(repos, 10);
    const res = await request(app).post("/api/drip").send({ address: TEST_ADDRESS });
    expect(res.body.status).toBe("already_funded");
    expect(sends()).toBe(1);
  });

  it("does not refill an account that still has enough", async () => {
    let balance = 0n;
    const { app, repos, sends } = setup(() => balance);
    await request(app).post("/api/drip").send({ address: TEST_ADDRESS });
    balance = 10n ** 18n; // 1 MON, above DRIP_MIN_BALANCE_MON
    await ageLastDrip(repos, 120);
    const res = await request(app).post("/api/drip").send({ address: TEST_ADDRESS });
    expect(res.body.status).toBe("already_funded");
    expect(sends()).toBe(1);
  });
});
