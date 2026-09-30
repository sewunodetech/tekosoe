// TODO: replace with @tekosoe/shared (packages/shared/src/abi/groupVault.ts) once this
// service is wired into the npm workspace. The workspace ABI currently exposes only
// membersOf/balanceOf, so the two extra view functions live here for now.
import { parseAbi } from "viem";

export const GROUP_STATUS = { Active: 0, Settled: 1 } as const;
export const SPEND_STATUS = { Pending: 0, Executed: 1, Rejected: 2 } as const;

/**
 * ASSUMPTION: the return shapes of getGroup/getSpend are taken from the backend spec.
 * Verify against the compiled ABI (packages/contracts/out/GroupVault.sol/GroupVault.json)
 * before relying on them — see docs/coverage.md.
 */
export const groupVaultAbi = parseAbi([
  "function getGroup(uint256 groupId) view returns (string name, address creator, bytes32 inviteHash, uint64 endsAt, uint64 disputeWindow, uint256 approvalThreshold, uint256 pool, uint8 status)",
  "function membersOf(uint256 groupId) view returns (address[])",
  "function getSpend(uint256 groupId, uint256 spendId) view returns (address spender, address to, uint256 amount, uint64 executedAt, uint8 status, bytes32 noteHash)",
  "function settle(uint256 groupId)",

  "event GroupCreated(uint256 indexed groupId, address indexed creator, string name, uint64 endsAt, uint256 approvalThreshold)",
  "event MemberJoined(uint256 indexed groupId, address indexed member, uint256 pullCap)",
  "event Deposited(uint256 indexed groupId, address indexed member, uint256 amount)",
  "event SpendRequested(uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount)",
  "event SpendExecuted(uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount, address[] participants, uint256[] shares, bytes32 noteHash)",
  "event SpendRejected(uint256 indexed groupId, uint256 indexed spendId, address indexed by)",
  "event ShareDisputed(uint256 indexed groupId, uint256 indexed spendId, address indexed participant, uint256 share)",
  "event ReceiptAttached(uint256 indexed groupId, uint256 indexed spendId, address indexed by, bytes32 receiptHash)",
  "event Settled(uint256 indexed groupId, uint256 poolBefore)",
  "event Pulled(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingDebt)",
  "event Refunded(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingCredit)",
  "event DebtPaid(uint256 indexed groupId, address indexed member, uint256 amount)",
]);
