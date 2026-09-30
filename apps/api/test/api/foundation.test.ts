import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  createFakeChain,
  createFakeEnvio,
  makeApp,
  mintToken,
  TEST_ADMIN_KEY,
  TEST_ADDRESS,
} from "../helpers/fakes";

describe("foundation", () => {
  it("answers the liveness probe without any dependency", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("uses the standard error envelope for unknown routes", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: "NOT_FOUND", message: "Route not found", details: {} },
    });
  });

  it("rejects malformed JSON with a readable error", async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post("/api/auth/challenge")
      .set("content-type", "application/json")
      .send("{ not json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });

  it("echoes a request id back to the caller", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/health").set("x-request-id", "trace-123");
    expect(res.headers["x-request-id"]).toBe("trace-123");
  });

  it("sets the security headers from helmet", async () => {
    const { app } = makeApp();
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

});

describe("GET /api/status", () => {
  it("requires the admin key", async () => {
    const { app } = makeApp();
    expect((await request(app).get("/api/status")).status).toBe(403);
    expect(
      (await request(app).get("/api/status").set("x-admin-key", "wrong")).status,
    ).toBe(403);
  });

  it("reports db, chain, envio, scheduler, wallets and features without secrets", async () => {
    const { app, env } = makeApp();
    const res = await request(app).get("/api/status").set("x-admin-key", TEST_ADMIN_KEY);

    expect(res.status).toBe(200);
    // The fake chain reports a 0 MON balance, so both backend wallets are "low" → degraded.
    expect(res.body.status).toBe("degraded");
    expect(res.body.db).toEqual({ ok: true, latencyMs: 1 });
    expect(res.body.chain).toMatchObject({ ok: true, chainId: 10143 });
    expect(res.body.envio).toEqual({ ok: true });
    expect(res.body.scheduler).toMatchObject({ running: false, lastError: null });
    expect(res.body.wallets.drip).toMatchObject({ balanceMon: 0, low: true });
    expect(res.body.features).toEqual({ receipts: true, push: true });

    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain(env.DRIP_PRIVATE_KEY);
    expect(raw).not.toContain(env.SETTLER_PRIVATE_KEY);
    expect(raw).not.toContain(env.ADMIN_API_KEY);
    expect(raw).not.toContain(env.AUTH_JWT_SECRET);
  });

  it("degrades when the database probe fails", async () => {
    const { app } = makeApp({
      pingDb: async () => ({ ok: false, latencyMs: null, error: "connection refused" }),
    });
    const res = await request(app).get("/api/status").set("x-admin-key", TEST_ADMIN_KEY);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("degraded");
    expect(res.body.db).toEqual({ ok: false, latencyMs: null, error: "connection refused" });
  });

  it("degrades when the indexer cannot be reached", async () => {
    const envio = createFakeEnvio();
    envio.failNext = true;
    const { app } = makeApp({ envio });
    const res = await request(app).get("/api/status").set("x-admin-key", TEST_ADMIN_KEY);
    expect(res.body.envio).toEqual({ ok: false });
    expect(res.body.status).toBe("degraded");
  });

  it("marks wallets as low when they drop under the threshold", async () => {
    const { app } = makeApp({
      chain: createFakeChain({
        async getNativeBalance() {
          return 100_000_000_000_000_000n; // 0.1 MON < 0.5 threshold
        },
      }),
    });
    const res = await request(app).get("/api/status").set("x-admin-key", TEST_ADMIN_KEY);
    expect(res.body.wallets.drip.low).toBe(true);
    expect(res.body.wallets.settler.low).toBe(true);
    expect(res.body.status).toBe("degraded");
  });
});

describe("profiles gate used by the invite screen", () => {
  it("answers 404 PROFILE_NOT_FOUND until a profile exists", async () => {
    const { app } = makeApp();
    const res = await request(app)
      .get("/api/profiles/me")
      .set("authorization", `Bearer ${await mintToken(TEST_ADDRESS)}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PROFILE_NOT_FOUND");
  });
});
