import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  encodeAbiParameters,
  encodeEventTopics,
  type Hash,
  type Log,
} from "viem";
import { computeInvoiceHash, groupVaultAbi } from "@tekosue/shared";
import { settleOutcomeFromLogs } from "../../src/chain/groupVault";
import { ensureInvoices } from "../../src/modules/invoices/service";
import { settleGroup } from "../../src/modules/settle/service";
import {
  authHeader,
  createFakeChain,
  FAKE_SETTLE_TX,
  makeApp,
  mintToken,
  OTHER_ADDRESS,
  TEST_ADDRESS,
  THIRD_ADDRESS,
} from "../helpers/fakes";

describe("settleOutcomeFromLogs", () => {
  const log = (eventName: "Settled" | "Pulled" | "Refunded", args: Record<string, unknown>, data: `0x${string}`) =>
    ({
      address: "0x9999999999999999999999999999999999999999",
      topics: encodeEventTopics({ abi: groupVaultAbi, eventName, args } as never),
      data,
      blockHash: null,
      blockNumber: null,
      logIndex: null,
      transactionHash: null,
      transactionIndex: null,
      removed: false,
    }) as unknown as Log;

  it("collects Pulled/Refunded for the group and requires a Settled event", () => {
    const logs = [
      log("Settled", { groupId: 7n }, encodeAbiParameters([{ type: "uint256" }], [100n])),
      log(
        "Pulled",
        { groupId: 7n, member: TEST_ADDRESS },
        encodeAbiParameters([{ type: "uint256" }, { type: "uint256" }], [4n, 1n]),
      ),
      log(
        "Refunded",
        { groupId: 7n, member: OTHER_ADDRESS },
        encodeAbiParameters([{ type: "uint256" }, { type: "uint256" }], [5n, 0n]),
      ),
      // Another group in the same transaction is ignored.
      log(
        "Refunded",
        { groupId: 8n, member: THIRD_ADDRESS },
        encodeAbiParameters([{ type: "uint256" }, { type: "uint256" }], [9n, 0n]),
      ),
    ];

    const outcome = settleOutcomeFromLogs(7n, FAKE_SETTLE_TX, logs)!;
    expect(outcome.pulled.get(TEST_ADDRESS)).toEqual({ amount: 4n, remainingDebt: 1n });
    expect(outcome.refunded.get(OTHER_ADDRESS)).toEqual({ amount: 5n, remainingCredit: 0n });
    expect(outcome.refunded.has(THIRD_ADDRESS)).toBe(false);

    expect(settleOutcomeFromLogs(7n, FAKE_SETTLE_TX, logs.slice(1))).toBeNull();
  });
});

describe("invoices", () => {
  it("are created once per member right after the scheduler settles", async () => {
    const { deps, repos } = makeApp();
    const result = await settleGroup(deps, 7n);
    expect(result.status).toBe("confirmed");

    const mine = await repos.invoices.get(7, TEST_ADDRESS);
    const other = await repos.invoices.get(7, OTHER_ADDRESS);
    expect(mine).toMatchObject({ number: "INV-7-001", status: "paid" });
    expect(other).toMatchObject({ number: "INV-7-002", status: "refunded" });
    expect(mine!.invoiceHash).toBe(computeInvoiceHash(mine!.payload));
    expect(JSON.parse(mine!.payload)).toMatchObject({ pulled: "10000000", settleTxHash: FAKE_SETTLE_TX });

    // Idempotent.
    expect(await ensureInvoices(deps, 7n, FAKE_SETTLE_TX)).toEqual({ status: "exists" });
  });

  it("marks a due invoice paid once DebtPaid covers the remaining debt", async () => {
    const chain = createFakeChain({
      async getSettleOutcome(groupId, txHash) {
        return {
          txHash,
          groupId,
          pulled: new Map([[TEST_ADDRESS, { amount: 4_000_000n, remainingDebt: 6_000_000n }]]),
          refunded: new Map(),
        };
      },
    });
    const { deps, repos } = makeApp({ chain });
    await ensureInvoices(deps, 7n, FAKE_SETTLE_TX);
    expect((await repos.invoices.get(7, TEST_ADDRESS))!.status).toBe("due");

    await repos.invoices.recordDebtPaid(7, TEST_ADDRESS, 5_000_000n);
    expect((await repos.invoices.get(7, TEST_ADDRESS))!.status).toBe("due");
    await repos.invoices.recordDebtPaid(7, TEST_ADDRESS, 1_000_000n);
    expect((await repos.invoices.get(7, TEST_ADDRESS))!.status).toBe("paid");
  });

  it("finds the settle transaction through Envio when a member settled", async () => {
    const { deps, envio, repos } = makeApp();
    expect(await ensureInvoices(deps, 7n)).toEqual({ status: "not_settled" });

    envio.settleTxs.set("7", FAKE_SETTLE_TX);
    expect(await ensureInvoices(deps, 7n)).toMatchObject({ status: "created", created: 2 });
    expect(await repos.invoices.countByGroup(7)).toBe(2);
  });

  it("serves my invoice to members and the shared one only with a valid share token", async () => {
    const { app, deps } = makeApp();
    await ensureInvoices(deps, 7n, FAKE_SETTLE_TX as Hash);

    const mine = await request(app).get("/api/groups/7/invoices/me").set(await authHeader(TEST_ADDRESS));
    expect(mine.status).toBe(200);
    expect(mine.body).toMatchObject({ number: "INV-7-001", status: "paid" });

    const shared = await request(app).get(`/api/invoices/INV-7-001?token=${mine.body.shareToken}`);
    expect(shared.status).toBe(200);
    expect(shared.body.invoiceHash).toBe(mine.body.invoiceHash);

    // A token for another invoice, or a session token, does not open it.
    const wrong = await request(app).get(`/api/invoices/INV-7-002?token=${mine.body.shareToken}`);
    expect(wrong.status).toBe(401);
    const session = await request(app).get(`/api/invoices/INV-7-001?token=${await mintToken(TEST_ADDRESS)}`);
    expect(session.status).toBe(401);

    // And a share token is not a session token.
    const asBearer = await request(app)
      .get("/api/profiles/me")
      .set({ authorization: `Bearer ${mine.body.shareToken}` });
    expect(asBearer.status).toBe(401);
  });
});
