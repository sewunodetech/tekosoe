import { describe, expect, it } from "vitest";
import type { ActivityRow } from "../../src/integrations/envio";
import { runDebtReminders, runNotifySweep } from "../../src/modules/notify/envioSource";
import { makeApp, OTHER_ADDRESS, TEST_ADDRESS, THIRD_ADDRESS } from "../helpers/fakes";

const TOKEN_A = "ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]";
const TOKEN_B = "ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]";
const TX = `0x${"ab".repeat(32)}`;
const CRYPTO_WORDS = /\b(wallets?|gas|seed phrases?|blockchains?|tokens?|hash(?:es)?|transactions?)\b/i;

function activity(over: Partial<ActivityRow>): ActivityRow {
  return {
    id: `${TX}-1`,
    groupId: "7",
    type: "SpendRequested",
    actor: TEST_ADDRESS,
    counterparty: null,
    amount: 150_000_000n,
    remaining: null,
    spendId: 2n,
    timestamp: 1_000,
    txHash: TX,
    ...over,
  };
}

async function setup() {
  const built = makeApp();
  await built.repos.pushSubs.upsert({ address: TEST_ADDRESS, expoPushToken: TOKEN_A, platform: "android" });
  await built.repos.pushSubs.upsert({ address: OTHER_ADDRESS, expoPushToken: TOKEN_B, platform: "android" });
  await built.repos.profiles.upsert({ address: TEST_ADDRESS, displayName: "Jack", countryCode: "AU", city: null, avatarColor: null });
  await built.repos.groupMeta.insert({ groupId: 7, name: "Japan Trip", createdBy: TEST_ADDRESS });
  return built;
}

describe("Envio notification source", () => {
  it("starts from now on the first run, so history is never pushed", async () => {
    const { deps, envio, push } = await setup();
    envio.activities.push(activity({ timestamp: 500 }));
    expect(await runNotifySweep(deps, 1_000)).toEqual({ handled: 0 });
    expect(push.sent).toHaveLength(0);
  });

  it("asks the other members to approve a payment, once", async () => {
    const { deps, envio, push } = await setup();
    await runNotifySweep(deps, 900);
    envio.activities.push(activity({}));

    expect(await runNotifySweep(deps, 1_000)).toEqual({ handled: 1 });
    expect(push.sent).toEqual([
      {
        to: TOKEN_B,
        title: "Japan Trip",
        body: "Jack wants to pay $150.00 from the pot. Tap to approve.",
        data: { url: "/trip/7/spend/2/approve", tag: "SpendRequested:7:2" },
      },
    ]);

    // The same row comes back at the cursor second: not sent twice.
    await runNotifySweep(deps, 1_100);
    expect(push.sent).toHaveLength(1);
  });

  it("tells each participant their share of an executed payment", async () => {
    const { deps, envio, push } = await setup();
    await runNotifySweep(deps, 900);
    envio.shares.set("7-2", [
      { participant: TEST_ADDRESS, share: 50_000_000n },
      { participant: OTHER_ADDRESS, share: 100_000_000n },
    ]);
    envio.activities.push(activity({ type: "SpendExecuted" }));

    await runNotifySweep(deps, 1_000);
    expect(push.sent.map((m) => [m.to, m.body, m.data.url])).toEqual([
      [TOKEN_B, "Jack paid $150.00 from the pot. Your share is $100.00.", "/trip/7/spend/2"],
    ]);
  });

  it("explains what is still owed after settle-up", async () => {
    const { deps, envio, push } = await setup();
    await runNotifySweep(deps, 900);
    envio.activities.push(
      activity({ id: `${TX}-3`, type: "Pulled", actor: OTHER_ADDRESS, amount: 5_000_000n, remaining: 45_000_000n, spendId: null }),
    );

    await runNotifySweep(deps, 1_000);
    expect(push.sent[0]).toMatchObject({
      to: TOKEN_B,
      body: "Your safety net covered $5.00. You still owe $45.00. Pay it to start your next trip.",
      data: { url: "/trip/7/invoice" },
    });
  });

  it("records a debt payment on the invoice", async () => {
    const { deps, envio, repos } = await setup();
    await runNotifySweep(deps, 900);
    const calls: unknown[][] = [];
    repos.invoices.recordDebtPaid = async (groupId, member, amount) => {
      calls.push([groupId, member, amount]);
      return null;
    };
    envio.activities.push(activity({ type: "DebtPaid", actor: OTHER_ADDRESS, amount: 45_000_000n, spendId: null }));

    await runNotifySweep(deps, 1_000);
    expect(calls).toEqual([[7, OTHER_ADDRESS, 45_000_000n]]);
  });

  it("never uses crypto words in any notification", async () => {
    const { deps, envio, push } = await setup();
    await runNotifySweep(deps, 900);
    envio.shares.set("7-2", [{ participant: OTHER_ADDRESS, share: 1n }]);
    const types = ["SpendRequested", "SpendExecuted", "SpendRejected", "ShareDisputed", "Settled", "Pulled", "Refunded"];
    types.forEach((type, i) =>
      envio.activities.push(activity({ id: `${TX}-${i + 10}`, type, actor: i % 2 ? OTHER_ADDRESS : TEST_ADDRESS, remaining: 1n })),
    );

    await runNotifySweep(deps, 1_000);
    expect(push.sent.length).toBeGreaterThan(types.length - 1);
    for (const message of push.sent) {
      expect(`${message.title} ${message.body}`).not.toMatch(CRYPTO_WORDS);
      expect(message.data.url.startsWith("/trip/7")).toBe(true);
    }
  });
});

describe("debt reminders", () => {
  it("reminds once a day, starting a day after the debt is first seen", async () => {
    const { deps, envio, push } = await setup();
    envio.debts.push({ groupId: "7", groupName: "Japan Trip", address: OTHER_ADDRESS, debt: 45_000_000n });
    const day = 24 * 3600;

    expect(await runDebtReminders(deps, 0)).toEqual({ sent: 0 });
    expect(await runDebtReminders(deps, day - 1)).toEqual({ sent: 0 });
    expect(await runDebtReminders(deps, day)).toEqual({ sent: 1 });
    expect(await runDebtReminders(deps, day + 60)).toEqual({ sent: 0 });

    expect(push.sent[0]).toMatchObject({
      to: TOKEN_B,
      title: "Japan Trip",
      body: "You still owe $45.00 from Japan Trip. Pay it to start or join your next trip.",
      data: { url: "/trip/7/invoice" },
    });
  });

  it("skips members without a push token", async () => {
    const { deps, envio, push } = await setup();
    envio.debts.push({ groupId: "7", groupName: "Japan Trip", address: THIRD_ADDRESS, debt: 1n });
    await runDebtReminders(deps, 0);
    await runDebtReminders(deps, 10 * 24 * 3600);
    expect(push.sent).toHaveLength(0);
  });
});
