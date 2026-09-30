import request from "supertest";
import { keccak256 } from "viem";
import { describe, expect, it } from "vitest";
import { sendPlan } from "../../src/modules/webhooks/notify";
import {
  authHeader,
  createFakeChain,
  makeApp,
  OTHER_ADDRESS,
  TEST_ADDRESS,
  THIRD_ADDRESS,
} from "../helpers/fakes";

const TOKEN_A = "ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]";
const TOKEN_B = "ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]";

describe("profiles", () => {
  it("stores the fields the mobile profile form sends", async () => {
    const { app } = makeApp();
    const headers = await authHeader(TEST_ADDRESS);

    const put = await request(app)
      .put("/api/profiles/me")
      .set(headers)
      .send({ displayName: "  Wei  ", countryCode: "au", city: "Sydney" });
    expect(put.status).toBe(200);
    expect(put.body).toMatchObject({
      displayName: "Wei",
      countryCode: "AU",
      city: "Sydney",
      avatarColor: null,
    });

    const list = await request(app).get(`/api/profiles?addresses=${TEST_ADDRESS}`);
    expect(list.body.profiles[0]).toMatchObject({ displayName: "Wei", countryCode: "AU" });
  });

  it("rejects a country name instead of an ISO code", async () => {
    const { app } = makeApp();
    const res = await request(app)
      .put("/api/profiles/me")
      .set(await authHeader(TEST_ADDRESS))
      .send({ displayName: "Wei", countryCode: "Australia" });
    expect(res.status).toBe(400);
  });
});

describe("push", () => {
  it("registers Expo push tokens and rejects anything else", async () => {
    const { app, repos } = makeApp();
    const headers = await authHeader(TEST_ADDRESS);

    const ok = await request(app)
      .post("/api/push/subscribe")
      .set(headers)
      .send({ expoPushToken: TOKEN_A, platform: "ios" });
    expect(ok.status).toBe(201);
    expect(await repos.pushSubs.listByAddresses([TEST_ADDRESS])).toHaveLength(1);

    const bad = await request(app)
      .post("/api/push/subscribe")
      .set(headers)
      .send({ expoPushToken: "https://push.example/endpoint", platform: "ios" });
    expect(bad.status).toBe(400);

    await request(app).delete("/api/push/subscribe").set(headers).send({ expoPushToken: TOKEN_A });
    expect(await repos.pushSubs.listByAddresses([TEST_ADDRESS])).toHaveLength(0);
  });

  it("sends per-recipient bodies and drops tokens Expo reports as unregistered", async () => {
    const { ctx, repos, push } = makeApp();
    await repos.pushSubs.upsert({ address: TEST_ADDRESS, expoPushToken: TOKEN_A, platform: "ios" });
    await repos.pushSubs.upsert({ address: OTHER_ADDRESS, expoPushToken: TOKEN_B, platform: "android" });
    push.results.set(TOKEN_B, "gone");

    const sent = await sendPlan(ctx, {
      groupId: 7n,
      title: "Bali",
      tag: "Settled:7",
      url: "/groups/7",
      bodies: new Map([
        [TEST_ADDRESS, "for A"],
        [OTHER_ADDRESS, "for B"],
      ]),
    });

    expect(sent).toBe(1);
    expect(push.sent.map((message) => [message.to, message.body])).toEqual([
      [TOKEN_A, "for A"],
      [TOKEN_B, "for B"],
    ]);
    expect(await repos.pushSubs.listByAddresses([OTHER_ADDRESS])).toHaveLength(0);
  });
});

describe("receipts", () => {
  it("uploads ciphertext for an on-chain spend and verifies receiptHash", async () => {
    const { app, storage } = makeApp();
    const headers = await authHeader(TEST_ADDRESS);

    const upload = await request(app)
      .post("/api/receipts/upload-url")
      .set(headers)
      .send({ groupId: "7", spendId: "3", sizeBytes: 4, mime: "image/jpeg" });
    expect(upload.status).toBe(201);

    const key = new URL(upload.body.uploadUrl as string).pathname.slice(1);
    expect(key).toMatch(/^receipts\/7\/3\/.+\.bin$/);
    const ciphertext = new Uint8Array([1, 2, 3, 4]);
    storage.objects.set(key, ciphertext);

    const wrong = await request(app)
      .post(`/api/receipts/${upload.body.receiptId}/confirm`)
      .set(headers)
      .send({ receiptHash: `0x${"00".repeat(32)}` });
    expect(wrong.status).toBe(400);

    const receiptHash = keccak256(ciphertext);
    const confirm = await request(app)
      .post(`/api/receipts/${upload.body.receiptId}/confirm`)
      .set(headers)
      .send({ receiptHash });
    expect(confirm.body).toEqual({ receiptId: upload.body.receiptId, status: "ready" });

    const found = await request(app).get(`/api/receipts/by-hash/${receiptHash}`).set(headers);
    expect(found.body).toMatchObject({ groupId: "7", spendId: "3", mime: "image/jpeg" });

    const outsider = await request(app)
      .get(`/api/receipts/by-hash/${receiptHash}`)
      .set(await authHeader(THIRD_ADDRESS));
    expect(outsider.status).toBe(403);
  });

  it("refuses a receipt for a spend that does not exist", async () => {
    const chain = createFakeChain({
      async getSpend() {
        return {
          spender: "0x0000000000000000000000000000000000000000",
          to: "0x0000000000000000000000000000000000000000",
          amount: 0n,
          executedAt: 0,
          status: 0,
          noteHash: `0x${"00".repeat(32)}`,
        };
      },
    });
    const { app } = makeApp({ chain });
    const res = await request(app)
      .post("/api/receipts/upload-url")
      .set(await authHeader(TEST_ADDRESS))
      .send({ groupId: "7", spendId: "99", sizeBytes: 4, mime: "application/pdf" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SPEND_NOT_FOUND");
  });
});
