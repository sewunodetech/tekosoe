// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IGroupVault
/// @notice Kas bersama per grup dalam AUSD. Spesifikasi: docs/03-spesifikasi-teknis.md, perubahan: ADR 0005.
/// Invariant sebelum settle: sum(deposited - used) semua anggota == pool.
/// Invariant setelah settle: sum(credit) == sum(debt) + pool (pool = dana yang ditahan untuk kreditur).
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
        /// @dev Alamat kunci undangan. Rahasia undangan (kunci privat) hanya ada di link; yang
        /// bergabung membawa tanda tangan kunci itu atas (vault, chainId, groupId, pendaftar).
        address inviteKey;
        uint64 endsAt; // tanggal grup berakhir
        uint64 disputeWindow; // detik; juga jeda setelah endsAt sebelum settle
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

    /// @dev Tanda tangan EIP-2612 untuk AUSD (permit ke vault).
    struct PermitSig {
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // ---------------------------------------------------------------- events

    event GroupCreated(
        uint256 indexed groupId,
        address indexed creator,
        string name,
        uint64 endsAt,
        uint64 disputeWindow,
        uint256 approvalThreshold
    );
    event MemberJoined(uint256 indexed groupId, address indexed member, uint256 pullCap);
    event Deposited(uint256 indexed groupId, address indexed member, uint256 amount);
    event SpendRequested(
        uint256 indexed groupId,
        uint256 indexed spendId,
        address indexed spender,
        address to,
        uint256 amount,
        address[] participants,
        uint256[] shares,
        bytes32 noteHash
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
    event ShareDisputed(
        uint256 indexed groupId, uint256 indexed spendId, address indexed participant, uint256 share
    );
    event ReceiptAttached(
        uint256 indexed groupId, uint256 indexed spendId, address indexed by, bytes32 receiptHash
    );
    event Settled(uint256 indexed groupId, uint256 poolBefore);
    /// @dev Saat settle: amount = yang berhasil ditarik; remainingDebt = sisa tagihan.
    event Pulled(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingDebt);
    /// @dev Saat settle, payDebt, atau claimCredit: amount = yang diterima anggota; remainingCredit = sisa hak.
    event Refunded(uint256 indexed groupId, address indexed member, uint256 amount, uint256 remainingCredit);
    event DebtPaid(uint256 indexed groupId, address indexed member, uint256 amount);

    // ---------------------------------------------------------------- errors

    error NotMember();
    error AlreadyMember();
    error GroupFull();
    error GroupNotActive();
    error GroupNotSettled();
    error GroupEnded();
    error InvalidInvite();
    error InvalidEndsAt();
    error InvalidDisputeWindow();
    error InvalidName();
    error InvalidAmount();
    error InvalidRecipient();
    error InsufficientPool();
    error SharesMismatch();
    error ParticipantNotMember();
    error DuplicateParticipant();
    error SpendNotFound();
    error SpendNotPending();
    error SpendNotExecuted();
    error CannotApproveOwnSpend();
    error NotParticipant();
    error DisputeWindowClosed();
    error TooEarlyToSettle();
    error NotSpender();
    error NoDebt();
    error NoCredit();

    // ---------------------------------------------------------------- mutations

    /// @notice Pembuat otomatis menjadi anggota pertama dengan batas izin tarik `pullCap`.
    function createGroup(
        string calldata name,
        address inviteKey,
        uint64 endsAt,
        uint64 disputeWindow,
        uint256 approvalThreshold,
        uint256 pullCap
    ) external returns (uint256 groupId);

    /// @notice Bergabung dan (opsional) setor awal. Butuh allowance AUSD ≥ initialDeposit
    /// (dan ≥ pullCap supaya kekurangan bisa ditarik saat settle).
    function joinGroup(uint256 groupId, bytes calldata inviteSig, uint256 pullCap, uint256 initialDeposit)
        external;

    /// @notice Seperti joinGroup, tapi izin AUSD diberikan lewat permit di transaksi yang sama
    /// (satu konfirmasi). `permit.value` sebaiknya initialDeposit + pullCap.
    function joinGroupWithPermit(
        uint256 groupId,
        bytes calldata inviteSig,
        uint256 pullCap,
        uint256 initialDeposit,
        PermitSig calldata permit
    ) external;

    function deposit(uint256 groupId, uint256 amount) external;

    function depositWithPermit(uint256 groupId, uint256 amount, PermitSig calldata permit) external;

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

    /// @dev Siapa saja, setelah endsAt + disputeWindow. Tarik saldo negatif sampai
    /// min(pullCap, saldo, allowance) tanpa pernah revert karena satu anggota; bayar saldo positif
    /// (proporsional kalau kas kurang); sisa jadi debt/credit.
    function settle(uint256 groupId) external;

    /// @notice Membayar debt; AUSD langsung diteruskan ke pemilik credit (urutan anggota).
    function payDebt(uint256 groupId, uint256 amount) external;

    /// @notice payDebt dengan izin AUSD lewat permit di transaksi yang sama.
    function payDebtWithPermit(uint256 groupId, uint256 amount, PermitSig calldata permit) external;

    /// @notice Menarik credit yang dananya sudah ditahan kas (mis. transfer saat settle gagal).
    function claimCredit(uint256 groupId) external;

    function attachReceipt(uint256 groupId, uint256 spendId, bytes32 receiptHash) external;

    // ---------------------------------------------------------------- views

    function getGroup(uint256 groupId) external view returns (Group memory);

    function membersOf(uint256 groupId) external view returns (address[] memory);

    function balanceOf(uint256 groupId, address member)
        external
        view
        returns (uint256 deposited, uint256 used, int256 net);

    function positionOf(uint256 groupId, address member)
        external
        view
        returns (uint256 deposited, uint256 used, int256 net, uint256 pullCap, uint256 debt, uint256 credit);

    function getSpend(uint256 groupId, uint256 spendId) external view returns (Spend memory);

    function spendParticipants(uint256 groupId, uint256 spendId)
        external
        view
        returns (address[] memory participants, uint256[] memory shares);

    function spendCount(uint256 groupId) external view returns (uint256);

    /// @notice Digest yang ditandatangani kunci undangan (EIP-191 personal_sign atas 32 byte ini).
    function inviteDigest(uint256 groupId, address joiner) external view returns (bytes32);
}
