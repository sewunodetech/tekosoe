import { describe, expect, it } from "vitest";
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  decodeFunctionResult,
  encodeErrorResult,
  encodeFunctionResult,
} from "viem";
import { GROUP_STATUS, groupVaultAbi } from "@tekosue/shared";
import { revertErrorName } from "../../src/chain/groupVault";

describe("groupVaultAbi", () => {
  it("decodes getGroup as one Group struct (contains a dynamic string)", () => {
    const group = {
      name: "Bali trip",
      creator: "0x1111111111111111111111111111111111111111",
      inviteKey: "0x4444444444444444444444444444444444444444",
      endsAt: 1_760_000_000n,
      disputeWindow: 86_400n,
      approvalThreshold: 50_000_000n,
      pool: 300_000_000n,
      status: GROUP_STATUS.Active,
    } as const;

    const data = encodeFunctionResult({ abi: groupVaultAbi, functionName: "getGroup", result: group });
    const decoded = decodeFunctionResult({ abi: groupVaultAbi, functionName: "getGroup", data });

    expect(decoded).toEqual(group);
  });

  it("decodes getSpend as one Spend struct", () => {
    const spend = {
      spender: "0x2222222222222222222222222222222222222222",
      to: "0x3333333333333333333333333333333333333333",
      amount: 12_500_000n,
      executedAt: 1_760_000_100n,
      status: 1,
      noteHash: `0x${"cd".repeat(32)}`,
    } as const;

    const data = encodeFunctionResult({ abi: groupVaultAbi, functionName: "getSpend", result: spend });
    expect(decodeFunctionResult({ abi: groupVaultAbi, functionName: "getSpend", data })).toEqual(spend);
  });
});

describe("revertErrorName", () => {
  const revert = (errorName: "GroupNotActive" | "TooEarlyToSettle") =>
    new ContractFunctionExecutionError(
      new ContractFunctionRevertedError({
        abi: groupVaultAbi,
        functionName: "settle",
        data: encodeErrorResult({ abi: groupVaultAbi, errorName }),
      }),
      { abi: groupVaultAbi, functionName: "settle", args: [1n] },
    );

  it("finds the custom error name inside a viem execution error", () => {
    expect(revertErrorName(revert("GroupNotActive"))).toBe("GroupNotActive");
    expect(revertErrorName(revert("TooEarlyToSettle"))).toBe("TooEarlyToSettle");
  });

  it("returns undefined for errors that are not contract reverts", () => {
    expect(revertErrorName(new Error("rpc down"))).toBeUndefined();
  });
});
