// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IGroupVault
/// @notice Kas bersama per grup dalam AUSD. Spesifikasi: docs/03-spesifikasi-teknis.md.
/// Invariant: sum(deposited - used) semua anggota == pool == saldo AUSD grup di kontrak (sebelum settle).
interface IGroupVault {
    enum GroupStatus {
        Active,
        Settled
    }

    enum SpendStatus {
        Pending,
        Executed,
        Rejected
    }

    struct Group {
        string name;
        address creator;
        bytes32 inviteHash;
        uint64 endsAt; // tanggal grup berakhir
        uint64 disputeWindow; // detik
        uint256 approvalThreshold; // di atas ini butuh persetujuan 1 anggota lain
        uint256 pool; // isi kas
        GroupStatus status;
    }

    struct Spend {
        address spender;
        address to; // anggota, toko demo, atau alamat lain
        uint256 amount;
        uint64 executedAt;
        SpendStatus status;
        bytes32 noteHash;
    }

    // ---------------------------------------------------------------- events

    event GroupCreated(
        uint256 indexed groupId, address indexed creator, string name, uint64 endsAt, uint256 approvalThreshold
    );
    event MemberJoined(uint256 indexed groupId, address indexed member, uint256 pullCap);
    event Deposited(uint256 indexed groupId, address indexed member, uint256 amount);
    event SpendRequested(
        uint256 indexed groupId, uint256 indexed spendId, address indexed spender, address to, uint256 amount
    );
    event SpendExecuted(
        uint256 indexed groupId,
        uint256 indexed spendId,
        address indexed spender,
        address to,
        uint256 amount,
        address[] participants,
        uint256[] shares,
        bytes32 noteHash
    );
    event SpendRejected(uint256 indexed groupId, uint256 indexed spendId, address indexed by);
    event ShareDisputed(uint256 indexed groupId, uint256 indexed spendId, address indexed participant, uint256 share);
    event ReceiptAttached(uint256 indexed groupId, uint256 indexed spendId, address indexed by, bytes32 receiptHash);
    event Settled(uint256 indexed groupId, uint256 poolBefore);
    event Pulled(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingDebt);
    event Refunded(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingCredit);
    event DebtPaid(uint256 indexed groupId, address indexed member, uint256 amount);

    // ---------------------------------------------------------------- errors

    error NotMember();
    error AlreadyMember();
    error GroupFull();
    error GroupNotActive();
    error GroupNotSettled();
    error InvalidInvite();
    error InvalidEndsAt();
    error InvalidAmount();
    error InsufficientPool();
    error SharesMismatch();
    error ParticipantNotMember();
    error SpendNotPending();
    error SpendNotExecuted();
    error CannotApproveOwnSpend();
    error NotParticipant();
    error DisputeWindowClosed();
    error TooEarlyToSettle();
    error NotSpender();
    error NoDebt();

    // ---------------------------------------------------------------- mutations

    function createGroup(
        string calldata name,
        bytes32 inviteHash,
        uint64 endsAt,
        uint64 disputeWindow,
        uint256 approvalThreshold
    ) external returns (uint256 groupId);

    /// @dev App meminta `approve` AUSD sebesar `pullCap` dalam signing session Mera yang sama.
    function joinGroup(uint256 groupId, bytes32 inviteSecret, uint256 pullCap) external;

    function deposit(uint256 groupId, uint256 amount) external;

    /// @dev amount <= approvalThreshold: langsung dibayar (SpendExecuted). Lebih: Pending (SpendRequested).
    function spend(
        uint256 groupId,
        address to,
        uint256 amount,
        address[] calldata participants,
        uint256[] calldata shares,
        bytes32 noteHash
    ) external returns (uint256 spendId);

    function approveSpend(uint256 groupId, uint256 spendId) external;

    function rejectSpend(uint256 groupId, uint256 spendId) external;

    function disputeShare(uint256 groupId, uint256 spendId) external;

    /// @dev Siapa saja, setelah endsAt + disputeWindow. Tarik saldo negatif sampai pullCap,
    /// bayar saldo positif (proporsional kalau kas kurang), sisa jadi debt/credit.
    function settle(uint256 groupId) external;

    function payDebt(uint256 groupId, uint256 amount) external;

    function attachReceipt(uint256 groupId, uint256 spendId, bytes32 receiptHash) external;

    // ---------------------------------------------------------------- views

    function getGroup(uint256 groupId) external view returns (Group memory);

    function membersOf(uint256 groupId) external view returns (address[] memory);

    function balanceOf(uint256 groupId, address member)
        external
        view
        returns (uint256 deposited, uint256 used, int256 net);

    function getSpend(uint256 groupId, uint256 spendId) external view returns (Spend memory);
}
