import request from "supertest";
import { describe, expect, it } from "vitest";
import { computeNoteHash } from "@tekosue/shared";
import type { Address } from "viem";
import {
  authHeader,
  createFakeChain,
  defaultGroup,
  makeApp,
  OTHER_ADDRESS,
  TEST_ADDRESS,
  THIRD_ADDRESS,
} from "../helpers/fakes";

const note = { title: "Dinner at Jimbaran", category: "food", note: "seafood", receiptHash: null };

function appWithSpend(noteHash = computeNoteHash(note)) {
  const chain = createFakeChain({
    async getGroup() {
      return defaultGroup();
    },
    async getSpend() {
      return {
        spender: TEST_ADDRESS as Address,
        to: OTHER_ADDRESS as Address,
        amount: 30_000_000n,
        executedAt: 0,
        status: 1,
        noteHash,
      };
    },
  });
  return makeApp({ chain });
}

describe("group meta", () => {
  it("lets only the on-chain creator write it", async () => {
    const { app } = appWithSpend();

    const notCreator = await request(app)
      .put("/api/groups/7/meta")
      .set(await authHeader(OTHER_ADDRESS))
      .send({ name: "Bali" });
    expect(notCreator.status).toBe(403);

    const ok = await request(app)
      .put("/api/groups/7/meta")
      .set(await authHeader(TEST_ADDRESS))
      .send({ name: " Bali " });
    expect(ok.status).toBe(201);

    const same = await request(app)
      .put("/api/groups/7/meta")
      .set(await authHeader(TEST_ADDRESS))
      .send({ name: "Bali" });
    expect(same.status).toBe(200);

    const changed = await request(app)
      .put("/api/groups/7/meta")
      .set(await authHeader(TEST_ADDRESS))
      .send({ name: "Lombok" });
    expect(changed.status).toBe(409);

    const pub = await request(app).get("/api/groups/7/meta");
    expect(pub.body).toMatchObject({ groupId: "7", name: "Bali" });
  });
});

describe("spend meta", () => {
  it("accepts details whose computeNoteHash equals the on-chain noteHash", async () => {
    const { app } = appWithSpend();
    const headers = await authHeader(TEST_ADDRESS);

    const put = await request(app).put("/api/groups/7/spends/3/meta").set(headers).send(note);
    expect(put.status).toBe(201);
    expect(put.body).toMatchObject({ spendId: "3", title: note.title, noteHash: computeNoteHash(note) });

    const again = await request(app).put("/api/groups/7/spends/3/meta").set(headers).send(note);
    expect(again.status).toBe(200);

    const list = await request(app).get("/api/groups/7/spends/meta").set(await authHeader(OTHER_ADDRESS));
    expect(list.body.spends).toHaveLength(1);
  });

  it("rejects details that do not match the on-chain noteHash", async () => {
    const { app } = appWithSpend();
    const res = await request(app)
      .put("/api/groups/7/spends/3/meta")
      .set(await authHeader(TEST_ADDRESS))
      .send({ ...note, title: "Something else" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("NOTE_HASH_MISMATCH");
  });

  it("rejects writes from members who did not pay, and from non-members", async () => {
    const { app } = appWithSpend();
    const other = await request(app)
      .put("/api/groups/7/spends/3/meta")
      .set(await authHeader(OTHER_ADDRESS))
      .send(note);
    expect(other.status).toBe(403);

    const outsider = await request(app)
      .get("/api/groups/7/spends/meta")
      .set(await authHeader(THIRD_ADDRESS));
    expect(outsider.status).toBe(403);
  });
});

describe("spend reviews", () => {
  it("keeps the first seen time and the reviewer's note", async () => {
    const { app } = appWithSpend();
    const headers = await authHeader(OTHER_ADDRESS);

    const seen = await request(app).put("/api/groups/7/spends/3/review").set(headers).send({ seen: true });
    expect(seen.status).toBe(200);
    const firstSeen = seen.body.seenAt;
    expect(firstSeen).toBeTruthy();

    const noted = await request(app)
      .put("/api/groups/7/spends/3/review")
      .set(headers)
      .send({ seen: true, decisionNote: "Too expensive" });
    expect(noted.body).toMatchObject({ seenAt: firstSeen, decisionNote: "Too expensive" });

    const list = await request(app).get("/api/groups/7/spends/reviews").set(headers);
    expect(list.body.reviews).toHaveLength(1);
  });
});
