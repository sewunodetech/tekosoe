import { parseAbi } from "viem";

/**
 * ABI GroupVault, ditulis tangan dari docs/03-spesifikasi-teknis.md.
 * Setelah kontrak final, ganti dengan ABI hasil `forge build`
 * (packages/contracts/out/GroupVault.sol/GroupVault.json) supaya tidak menyimpang.
 */
export const GROUP_STATUS = { Active: 0, Settled: 1 } as const;
export const SPEND_STATUS = { Pending: 0, Executed: 1, Rejected: 2 } as const;

export const groupVaultAbi = parseAbi([
  // Enum di-encode sebagai uint8 (lihat GROUP_STATUS / SPEND_STATUS).
  "struct Group { string name; address creator; bytes32 inviteHash; uint64 endsAt; uint64 disputeWindow; uint256 approvalThreshold; uint256 pool; uint8 status; }",
  "struct Spend { address spender; address to; uint256 amount; uint64 executedAt; uint8 status; bytes32 noteHash; }",

  "function createGroup(string name, bytes32 inviteHash, uint64 endsAt, uint64 disputeWindow, uint256 approvalThreshold) returns (uint256 groupId)",
  "function joinGroup(uint256 groupId, bytes32 inviteSecret, uint256 pullCap)",
  "function deposit(uint256 groupId, uint256 amount)",
  "function spend(uint256 groupId, address to, uint256 amount, address[] participants, uint256[] shares, bytes32 noteHash) returns (uint256 spendId)",
  "function approveSpend(uint256 groupId, uint256 spendId)",
  "function rejectSpend(uint256 groupId, uint256 spendId)",
  "function disputeShare(uint256 groupId, uint256 spendId)",
  "function settle(uint256 groupId)",
  "function payDebt(uint256 groupId, uint256 amount)",
  "function attachReceipt(uint256 groupId, uint256 spendId, bytes32 receiptHash)",

  "function getGroup(uint256 groupId) view returns (Group)",
  "function membersOf(uint256 groupId) view returns (address[])",
  "function balanceOf(uint256 groupId, address member) view returns (uint256 deposited, uint256 used, int256 net)",
  "function getSpend(uint256 groupId, uint256 spendId) view returns (Spend)",

  "error NotMember()",
  "error AlreadyMember()",
  "error GroupFull()",
  "error GroupNotActive()",
  "error GroupNotSettled()",
  "error InvalidInvite()",
  "error InvalidEndsAt()",
  "error InvalidAmount()",
  "error InsufficientPool()",
  "error SharesMismatch()",
  "error ParticipantNotMember()",
  "error SpendNotPending()",
  "error SpendNotExecuted()",
  "error CannotApproveOwnSpend()",
  "error NotParticipant()",
  "error DisputeWindowClosed()",
  "error TooEarlyToSettle()",
  "error NotSpender()",
  "error NoDebt()",

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
