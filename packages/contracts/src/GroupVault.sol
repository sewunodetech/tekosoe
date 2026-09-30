// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IGroupVault} from "./interfaces/IGroupVault.sol";

/// @title GroupVault
/// @notice Kas bersama per grup dalam AUSD yang settle-up sendiri.
/// Aturan: setiap fungsi yang memindahkan AUSD memakai nonReentrant + SafeERC20 dan mengubah state
/// sebelum transfer. settle tidak pernah revert karena satu anggota (akun dibekukan, saldo/izin kurang):
/// yang gagal ditarik jadi debt, yang gagal dibayar jadi credit yang dananya ditahan kas.
contract GroupVault is IGroupVault, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_MEMBERS = 10;
    uint64 public constant MAX_DISPUTE_WINDOW = 30 days;
    uint256 public constant MAX_NAME_BYTES = 64;

    IERC20 public immutable ausd;

    /// @notice Jumlah grup; id grup mulai dari 1 (0 = tidak ada).
    uint256 public groupCount;

    mapping(uint256 => Group) internal groups;
    mapping(uint256 => address[]) internal members;
    mapping(uint256 => mapping(address => bool)) internal isMember;
    mapping(uint256 => mapping(address => uint256)) internal deposited;
    mapping(uint256 => mapping(address => uint256)) internal used;
    mapping(uint256 => mapping(address => uint256)) internal pullCap; // batas izin tarik saat settle
    mapping(uint256 => Spend[]) internal spends;
    mapping(uint256 => mapping(uint256 => address[])) internal participantsOf;
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) internal shareOf;
    mapping(uint256 => mapping(address => uint256)) internal debt; // sisa tagihan setelah settle
    mapping(uint256 => mapping(address => uint256)) internal credit; // sisa hak yang belum terbayar

    constructor(IERC20 ausd_) {
        if (address(ausd_) == address(0)) revert InvalidRecipient();
        ausd = ausd_;
    }

    // ---------------------------------------------------------------- modifiers / guards

    function _existing(uint256 groupId) internal view returns (Group storage g) {
        g = groups[groupId];
        if (g.creator == address(0)) revert GroupNotActive();
    }

    function _active(uint256 groupId) internal view returns (Group storage g) {
        g = _existing(groupId);
        if (g.status != GroupStatus.Active) revert GroupNotActive();
    }

    function _settled(uint256 groupId) internal view returns (Group storage g) {
        g = _existing(groupId);
        if (g.status != GroupStatus.Settled) revert GroupNotSettled();
    }

    function _onlyMember(uint256 groupId) internal view {
        if (!isMember[groupId][msg.sender]) revert NotMember();
    }

    function _spend(uint256 groupId, uint256 spendId) internal view returns (Spend storage s) {
        if (spendId >= spends[groupId].length) revert SpendNotFound();
        s = spends[groupId][spendId];
    }

    // ---------------------------------------------------------------- groups & members

    /// @inheritdoc IGroupVault
    function createGroup(
        string calldata name,
        address inviteKey,
        uint64 endsAt,
        uint64 disputeWindow,
        uint256 approvalThreshold,
        uint256 pullCap_
    ) external returns (uint256 groupId) {
        uint256 nameLength = bytes(name).length;
        if (nameLength == 0 || nameLength > MAX_NAME_BYTES) revert InvalidName();
        if (inviteKey == address(0)) revert InvalidInvite();
        if (endsAt <= block.timestamp) revert InvalidEndsAt();
        if (disputeWindow > MAX_DISPUTE_WINDOW) revert InvalidDisputeWindow();

        groupId = ++groupCount;
        groups[groupId] = Group({
            name: name,
            creator: msg.sender,
            inviteKey: inviteKey,
            endsAt: endsAt,
            disputeWindow: disputeWindow,
            approvalThreshold: approvalThreshold,
            pool: 0,
            status: GroupStatus.Active
        });

        emit GroupCreated(groupId, msg.sender, name, endsAt, disputeWindow, approvalThreshold);
        _addMember(groupId, msg.sender, pullCap_);
    }

    /// @inheritdoc IGroupVault
    function inviteDigest(uint256 groupId, address joiner) public view returns (bytes32) {
        return keccak256(abi.encode(address(this), block.chainid, groupId, joiner));
    }

    /// @inheritdoc IGroupVault
    function joinGroup(uint256 groupId, bytes calldata inviteSig, uint256 pullCap_, uint256 initialDeposit)
        external
        nonReentrant
    {
        _join(groupId, inviteSig, pullCap_, initialDeposit);
    }

    /// @inheritdoc IGroupVault
    function joinGroupWithPermit(
        uint256 groupId,
        bytes calldata inviteSig,
        uint256 pullCap_,
        uint256 initialDeposit,
        PermitSig calldata permit
    ) external nonReentrant {
        _permit(permit);
        _join(groupId, inviteSig, pullCap_, initialDeposit);
    }

    function _join(uint256 groupId, bytes calldata inviteSig, uint256 pullCap_, uint256 initialDeposit)
        internal
    {
        Group storage g = _active(groupId);
        if (block.timestamp >= g.endsAt) revert GroupEnded();
        if (isMember[groupId][msg.sender]) revert AlreadyMember();
        if (members[groupId].length >= MAX_MEMBERS) revert GroupFull();

        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(inviteDigest(groupId, msg.sender));
        (address signer, ECDSA.RecoverError err,) = ECDSA.tryRecover(digest, inviteSig);
        if (err != ECDSA.RecoverError.NoError || signer != g.inviteKey) revert InvalidInvite();

        _addMember(groupId, msg.sender, pullCap_);
        if (initialDeposit > 0) _deposit(groupId, g, initialDeposit);
    }

    function _addMember(uint256 groupId, address member, uint256 pullCap_) internal {
        isMember[groupId][member] = true;
        members[groupId].push(member);
        pullCap[groupId][member] = pullCap_;
        emit MemberJoined(groupId, member, pullCap_);
    }

    // ---------------------------------------------------------------- deposits

    function deposit(uint256 groupId, uint256 amount) external nonReentrant {
        _onlyMember(groupId);
        Group storage g = _active(groupId);
        if (block.timestamp >= g.endsAt) revert GroupEnded();
        _deposit(groupId, g, amount);
    }

    function depositWithPermit(uint256 groupId, uint256 amount, PermitSig calldata permit)
        external
        nonReentrant
    {
        _onlyMember(groupId);
        Group storage g = _active(groupId);
        if (block.timestamp >= g.endsAt) revert GroupEnded();
        _permit(permit);
        _deposit(groupId, g, amount);
    }

    function _deposit(uint256 groupId, Group storage g, uint256 amount) internal {
        if (amount == 0) revert InvalidAmount();
        deposited[groupId][msg.sender] += amount;
        g.pool += amount;
        emit Deposited(groupId, msg.sender, amount);
        ausd.safeTransferFrom(msg.sender, address(this), amount);
    }

    /// @dev Permit bisa sudah dipakai orang lain (front-run); kalau gagal, lanjut dan biarkan
    /// transferFrom yang menentukan apakah izinnya cukup.
    function _permit(PermitSig calldata p) internal {
        try IERC20Permit(address(ausd))
            .permit(msg.sender, address(this), p.value, p.deadline, p.v, p.r, p.s) {}
            catch {}
    }

    // ---------------------------------------------------------------- spends

    /// @inheritdoc IGroupVault
    function spend(
        uint256 groupId,
        address to,
        uint256 amount,
        address[] calldata participants,
        uint256[] calldata shares,
        bytes32 noteHash
    ) external nonReentrant returns (uint256 spendId) {
        _onlyMember(groupId);
        Group storage g = _active(groupId);
        if (block.timestamp >= g.endsAt) revert GroupEnded();
        if (to == address(0) || to == address(this)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        if (amount > g.pool) revert InsufficientPool();
        _checkShares(groupId, amount, participants, shares);

        spendId = spends[groupId].length;
        spends[groupId].push(
            Spend({
                spender: msg.sender,
                to: to,
                amount: amount,
                executedAt: 0,
                status: SpendStatus.Pending,
                noteHash: noteHash
            })
        );
        address[] storage stored = participantsOf[groupId][spendId];
        for (uint256 i = 0; i < participants.length; i++) {
            stored.push(participants[i]);
            shareOf[groupId][spendId][participants[i]] = shares[i];
        }

        if (amount <= g.approvalThreshold) {
            _execute(groupId, g, spendId);
        } else {
            emit SpendRequested(groupId, spendId, msg.sender, to, amount, participants, shares, noteHash);
        }
    }

    function _checkShares(
        uint256 groupId,
        uint256 amount,
        address[] calldata participants,
        uint256[] calldata shares
    ) internal view {
        uint256 n = participants.length;
        if (n == 0 || n != shares.length || n > MAX_MEMBERS) revert SharesMismatch();
        uint256 sum;
        for (uint256 i = 0; i < n; i++) {
            if (!isMember[groupId][participants[i]]) revert ParticipantNotMember();
            if (shares[i] == 0) revert InvalidAmount();
            for (uint256 j = 0; j < i; j++) {
                if (participants[j] == participants[i]) revert DuplicateParticipant();
            }
            sum += shares[i];
        }
        if (sum != amount) revert SharesMismatch();
    }

    function _execute(uint256 groupId, Group storage g, uint256 spendId) internal {
        Spend storage s = spends[groupId][spendId];
        if (s.amount > g.pool) revert InsufficientPool();

        address[] storage ps = participantsOf[groupId][spendId];
        uint256[] memory shares = new uint256[](ps.length);
        for (uint256 i = 0; i < ps.length; i++) {
            uint256 share = shareOf[groupId][spendId][ps[i]];
            used[groupId][ps[i]] += share;
            shares[i] = share;
        }
        g.pool -= s.amount;
        s.status = SpendStatus.Executed;
        s.executedAt = uint64(block.timestamp);

        emit SpendExecuted(groupId, spendId, s.spender, s.to, s.amount, ps, shares, s.noteHash);
        ausd.safeTransfer(s.to, s.amount);
    }

    function approveSpend(uint256 groupId, uint256 spendId) external nonReentrant {
        _onlyMember(groupId);
        Group storage g = _active(groupId);
        Spend storage s = _spend(groupId, spendId);
        if (s.status != SpendStatus.Pending) revert SpendNotPending();
        if (s.spender == msg.sender) revert CannotApproveOwnSpend();
        _execute(groupId, g, spendId);
    }

    function rejectSpend(uint256 groupId, uint256 spendId) external {
        _onlyMember(groupId);
        _active(groupId);
        Spend storage s = _spend(groupId, spendId);
        if (s.status != SpendStatus.Pending) revert SpendNotPending();
        if (s.spender == msg.sender) revert CannotApproveOwnSpend();
        s.status = SpendStatus.Rejected;
        emit SpendRejected(groupId, spendId, msg.sender);
    }

    /// @notice Peserta menolak bagiannya dalam jendela keberatan; bagiannya pindah ke pemakai.
    function disputeShare(uint256 groupId, uint256 spendId) external {
        Group storage g = _active(groupId);
        Spend storage s = _spend(groupId, spendId);
        if (s.status != SpendStatus.Executed) revert SpendNotExecuted();
        if (block.timestamp > uint256(s.executedAt) + g.disputeWindow) revert DisputeWindowClosed();
        uint256 share = shareOf[groupId][spendId][msg.sender];
        if (share == 0 || msg.sender == s.spender) revert NotParticipant();

        shareOf[groupId][spendId][msg.sender] = 0;
        used[groupId][msg.sender] -= share;
        used[groupId][s.spender] += share;
        emit ShareDisputed(groupId, spendId, msg.sender, share);
    }

    function attachReceipt(uint256 groupId, uint256 spendId, bytes32 receiptHash) external {
        _active(groupId);
        Spend storage s = _spend(groupId, spendId);
        if (s.spender != msg.sender) revert NotSpender();
        if (receiptHash == bytes32(0)) revert InvalidAmount();
        emit ReceiptAttached(groupId, spendId, msg.sender, receiptHash);
    }

    // ---------------------------------------------------------------- settle

    /// @inheritdoc IGroupVault
    function settle(uint256 groupId) external nonReentrant {
        Group storage g = _active(groupId);
        if (block.timestamp < uint256(g.endsAt) + g.disputeWindow) revert TooEarlyToSettle();

        g.status = GroupStatus.Settled;
        emit Settled(groupId, g.pool);

        (int256[] memory nets, uint256 totalPositive) = _pullDebtors(groupId, g);
        _payPositives(groupId, g, nets, totalPositive);
    }

    /// @dev Fase 1: tarik saldo negatif sebisanya (min pullCap, saldo, allowance); sisanya jadi debt.
    function _pullDebtors(uint256 groupId, Group storage g)
        internal
        returns (int256[] memory nets, uint256 totalPositive)
    {
        address[] storage ms = members[groupId];
        nets = new int256[](ms.length);
        for (uint256 i = 0; i < ms.length; i++) {
            address m = ms[i];
            // Nominal AUSD jauh di bawah 2^255, jadi cast ke int256 aman.
            // forge-lint: disable-next-line(unsafe-typecast)
            int256 net = int256(deposited[groupId][m]) - int256(used[groupId][m]);
            nets[i] = net;
            if (net > 0) {
                // forge-lint: disable-next-line(unsafe-typecast)
                totalPositive += uint256(net); // net > 0
            } else if (net < 0) {
                // forge-lint: disable-next-line(unsafe-typecast)
                uint256 owed = uint256(-net); // net < 0, dan |net| jauh di bawah 2^255
                uint256 pull = _pullable(groupId, m, owed);
                if (pull > 0 && ausd.trySafeTransferFrom(m, address(this), pull)) {
                    g.pool += pull;
                } else {
                    pull = 0;
                }
                debt[groupId][m] = owed - pull;
                emit Pulled(groupId, m, pull, owed - pull);
            }
        }
    }

    /// @dev Fase 2: bayar saldo positif, proporsional kalau kas kurang. Anggota positif terakhir menerima
    /// sisa pembagian supaya tidak ada debu tertinggal. Transfer gagal → dana tetap di kas sebagai credit.
    function _payPositives(uint256 groupId, Group storage g, int256[] memory nets, uint256 totalPositive)
        internal
    {
        address[] storage ms = members[groupId];
        uint256 remainingPositive = totalPositive;
        uint256 remainingAvailable = g.pool;
        for (uint256 i = 0; i < nets.length; i++) {
            if (nets[i] <= 0) continue;
            uint256 entitled = uint256(nets[i]);
            uint256 pay = entitled == remainingPositive
                ? remainingAvailable
                : (entitled * remainingAvailable) / remainingPositive;
            remainingPositive -= entitled;
            remainingAvailable -= pay;
            _payOut(groupId, g, ms[i], pay, entitled - pay);
        }
    }

    function _payOut(uint256 groupId, Group storage g, address m, uint256 pay, uint256 creditLeft) internal {
        if (pay > 0) {
            g.pool -= pay;
            if (!ausd.trySafeTransfer(m, pay)) {
                g.pool += pay;
                creditLeft += pay;
                pay = 0;
            }
        }
        credit[groupId][m] = creditLeft;
        emit Refunded(groupId, m, pay, creditLeft);
    }

    function _pullable(uint256 groupId, address m, uint256 owed) internal view returns (uint256 pull) {
        pull = owed;
        uint256 cap = pullCap[groupId][m];
        if (cap < pull) pull = cap;
        uint256 balance = ausd.balanceOf(m);
        if (balance < pull) pull = balance;
        uint256 allowance = ausd.allowance(m, address(this));
        if (allowance < pull) pull = allowance;
    }

    /// @inheritdoc IGroupVault
    function payDebt(uint256 groupId, uint256 amount) external nonReentrant {
        Group storage g = _settled(groupId);
        uint256 owed = debt[groupId][msg.sender];
        if (owed == 0) revert NoDebt();
        if (amount == 0) revert InvalidAmount();
        if (amount > owed) amount = owed;

        debt[groupId][msg.sender] = owed - amount;
        emit DebtPaid(groupId, msg.sender, amount);
        ausd.safeTransferFrom(msg.sender, address(this), amount);

        uint256 remaining = _payCreditors(groupId, g, amount);
        // Invariant sum(credit) == sum(debt) + pool menjamin remaining == 0; jaga-jaga tetap dicatat di kas.
        if (remaining > 0) g.pool += remaining;
    }

    /// @dev Teruskan `amount` langsung ke pemilik credit, urut anggota. Transfer yang gagal
    /// (akun dibekukan) ditahan kas; anggotanya bisa claimCredit nanti.
    function _payCreditors(uint256 groupId, Group storage g, uint256 amount)
        internal
        returns (uint256 remaining)
    {
        address[] storage ms = members[groupId];
        remaining = amount;
        for (uint256 i = 0; i < ms.length && remaining > 0; i++) {
            address m = ms[i];
            uint256 c = credit[groupId][m];
            if (c == 0) continue;
            uint256 pay = c < remaining ? c : remaining;
            remaining -= pay;
            c -= pay;
            if (!ausd.trySafeTransfer(m, pay)) {
                g.pool += pay;
                c += pay;
                pay = 0;
            }
            credit[groupId][m] = c;
            emit Refunded(groupId, m, pay, c);
        }
    }

    /// @inheritdoc IGroupVault
    function claimCredit(uint256 groupId) external nonReentrant {
        Group storage g = _settled(groupId);
        uint256 c = credit[groupId][msg.sender];
        uint256 pay = c < g.pool ? c : g.pool;
        if (pay == 0) revert NoCredit();

        credit[groupId][msg.sender] = c - pay;
        g.pool -= pay;
        emit Refunded(groupId, msg.sender, pay, c - pay);
        ausd.safeTransfer(msg.sender, pay);
    }

    // ---------------------------------------------------------------- views

    function getGroup(uint256 groupId) external view returns (Group memory) {
        return groups[groupId];
    }

    function membersOf(uint256 groupId) external view returns (address[] memory) {
        return members[groupId];
    }

    function balanceOf(uint256 groupId, address member)
        external
        view
        returns (uint256 deposited_, uint256 used_, int256 net)
    {
        deposited_ = deposited[groupId][member];
        used_ = used[groupId][member];
        // Nominal AUSD jauh di bawah 2^255, jadi cast ke int256 aman.
        // forge-lint: disable-next-line(unsafe-typecast)
        net = int256(deposited_) - int256(used_);
    }

    function positionOf(uint256 groupId, address member)
        external
        view
        returns (
            uint256 deposited_,
            uint256 used_,
            int256 net,
            uint256 pullCap_,
            uint256 debt_,
            uint256 credit_
        )
    {
        deposited_ = deposited[groupId][member];
        used_ = used[groupId][member];
        // Nominal AUSD jauh di bawah 2^255, jadi cast ke int256 aman.
        // forge-lint: disable-next-line(unsafe-typecast)
        net = int256(deposited_) - int256(used_);
        pullCap_ = pullCap[groupId][member];
        debt_ = debt[groupId][member];
        credit_ = credit[groupId][member];
    }

    function getSpend(uint256 groupId, uint256 spendId) external view returns (Spend memory) {
        return _spend(groupId, spendId);
    }

    function spendParticipants(uint256 groupId, uint256 spendId)
        external
        view
        returns (address[] memory participants, uint256[] memory shares)
    {
        _spend(groupId, spendId);
        participants = participantsOf[groupId][spendId];
        shares = new uint256[](participants.length);
        for (uint256 i = 0; i < participants.length; i++) {
            shares[i] = shareOf[groupId][spendId][participants[i]];
        }
    }

    function spendCount(uint256 groupId) external view returns (uint256) {
        return spends[groupId].length;
    }
}
