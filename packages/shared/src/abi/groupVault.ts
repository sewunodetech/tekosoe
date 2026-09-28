import { parseAbi } from "viem";

/**
 * ABI GroupVault, ditulis tangan dari docs/03-spesifikasi-teknis.md.
 * Setelah kontrak final, ganti dengan ABI hasil `forge build`
 * (packages/contracts/out/GroupVault.sol/GroupVault.json) supaya tidak menyimpang.
 */
export const groupVaultAbi = parseAbi([
  // enum GroupStatus { Active, Settled }; enum SpendStatus { Pending, Executed, Rejected }
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

  "function membersOf(uint256 groupId) view returns (address[])",
  "function balanceOf(uint256 groupId, address member) view returns (uint256 deposited, uint256 used, int256 net)",

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
