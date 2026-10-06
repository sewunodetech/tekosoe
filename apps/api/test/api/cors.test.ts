import request from "supertest";
import { describe, expect, it } from "vitest";
import { makeApp, testEnv } from "../helpers/fakes";

// Req 9.2: the static web on tekosue.xyz reads the trip name and shared invoices from the browser.
describe("CORS for the web", () => {
  const origin = "https://tekosue.xyz";
  const { app } = makeApp({ env: testEnv({ CORS_ORIGINS: `${origin},http://localhost:3000` }) });

  it.each(["/api/groups/1/meta", "/api/invoices/INV-1-001?token=x"])("allows %s from tekosue.xyz", async (path) => {
    const res = await request(app).get(path).set("Origin", origin);
    expect(res.headers["access-control-allow-origin"]).toBe(origin);
  });

  it("does not allow other origins", async () => {
    const res = await request(app).get("/api/groups/1/meta").set("Origin", "https://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
