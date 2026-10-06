// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {GroupVault} from "../src/GroupVault.sol";
import {IGroupVault} from "../src/interfaces/IGroupVault.sol";

/// @dev Meniru AUSD testnet (diverifikasi on-chain): 6 desimal, EIP-2612 permit, akun bisa dibekukan.
/// Hanya untuk test — integrasi nyata memakai AUSD testnet.
contract MockAUSD is ERC20, ERC20Permit {
    mapping(address => bool) public isAccountFrozen;

    constructor() ERC20("Agora Dollar", "AUSD") ERC20Permit("Agora Dollar") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function freeze(address account, bool frozen) external {
        isAccountFrozen[account] = frozen;
    }

    function _update(address from, address to, uint256 value) internal override {
        require(!isAccountFrozen[from] && !isAccountFrozen[to], "frozen");
        super._update(from, to, value);
    }
}

/// @dev Token jahat: memanggil balik vault saat transferFrom untuk menguji nonReentrant.
contract ReentrantToken is ERC20 {
    GroupVault public vault;
    uint256 public groupId;
    bool public armed;

    constructor() ERC20("Evil", "EVIL") {}

    function arm(GroupVault vault_, uint256 groupId_) external {
        vault = vault_;
        groupId = groupId_;
        armed = true;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        if (armed) {
            armed = false;
            vault.deposit(groupId, 1);
        }
        return super.transferFrom(from, to, value);
    }
}

contract GroupVaultTest is Test {
    uint256 internal constant USD = 1e6;
    int256 internal constant SUSD = 1e6;
    uint64 internal constant WINDOW = 1 days;

    MockAUSD internal ausd;
    GroupVault internal vault;

    uint256 internal aKey = 0xA11CE;
    uint256 internal bKey = 0xB0B;
    uint256 internal cKey = 0xC4A;
    uint256 internal inviteKey = 0x1A7E;
    address internal a;
    address internal b;
    address internal c;
    address internal invite;
    address internal shop = makeAddr("konbini");

    uint64 internal endsAt;

    function setUp() public {
        ausd = new MockAUSD();
        vault = new GroupVault(ausd);
        a = vm.addr(aKey);
        b = vm.addr(bKey);
        c = vm.addr(cKey);
        invite = vm.addr(inviteKey);
        endsAt = uint64(block.timestamp + 7 days);

        address[3] memory people = [a, b, c];
        for (uint256 i = 0; i < people.length; i++) {
            ausd.mint(people[i], 1_000 * USD);
            vm.prank(people[i]);
            ausd.approve(address(vault), type(uint256).max);
        }
    }

    // ---------------------------------------------------------------- helpers

    function _inviteSig(uint256 groupId, address joiner) internal view returns (bytes memory) {
        return _inviteSigWith(inviteKey, groupId, joiner);
    }

    /// @dev Computed locally (no external call) so it can sit inside a call right after vm.prank.
    function _localInviteDigest(uint256 groupId, address joiner) internal view returns (bytes32) {
        return keccak256(abi.encode(address(vault), block.chainid, groupId, joiner));
    }

    function _inviteSigWith(uint256 key, uint256 groupId, address joiner)
        internal
        view
        returns (bytes memory)
    {
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(_localInviteDigest(groupId, joiner));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
        return abi.encodePacked(r, s, v);
    }

    function _create(uint256 threshold) internal returns (uint256 groupId) {
        vm.prank(a);
        groupId = vault.createGroup("Japan trip", invite, endsAt, WINDOW, threshold, 500 * USD);
    }

    /// A, B, C each put in 100 with a 500 safety net.
    function _groupOfThree(uint256 threshold) internal returns (uint256 groupId) {
        groupId = _create(threshold);
        vm.prank(a);
        vault.deposit(groupId, 100 * USD);
        vm.prank(b);
        vault.joinGroup(groupId, _inviteSig(groupId, b), 500 * USD, 100 * USD);
        vm.prank(c);
        vault.joinGroup(groupId, _inviteSig(groupId, c), 500 * USD, 100 * USD);
    }

    function _split(address[] memory ps, uint256 each) internal pure returns (uint256[] memory shares) {
        shares = new uint256[](ps.length);
        for (uint256 i = 0; i < ps.length; i++) {
            shares[i] = each;
        }
    }

    function _all() internal view returns (address[] memory ps) {
        ps = new address[](3);
        ps[0] = a;
        ps[1] = b;
        ps[2] = c;
    }

    function _pair(address x, address y) internal pure returns (address[] memory ps) {
        ps = new address[](2);
        ps[0] = x;
        ps[1] = y;
    }

    function _spend(
        uint256 groupId,
        address spender,
        uint256 amount,
        address[] memory ps,
        uint256[] memory shares
    ) internal returns (uint256) {
        vm.prank(spender);
        return vault.spend(groupId, shop, amount, ps, shares, keccak256("note"));
    }

    function _net(uint256 groupId, address m) internal view returns (int256 net) {
        (,, net) = vault.balanceOf(groupId, m);
    }

    function _debt(uint256 groupId, address m) internal view returns (uint256 d) {
        (,,,, d,) = vault.positionOf(groupId, m);
    }

    function _credit(uint256 groupId, address m) internal view returns (uint256 cr) {
        (,,,,, cr) = vault.positionOf(groupId, m);
    }

    function _settleNow(uint256 groupId) internal {
        vm.warp(uint256(endsAt) + WINDOW);
        vault.settle(groupId);
    }

    // ---------------------------------------------------------------- create & join

    function test_createGroup_creatorIsFirstMember() public {
        vm.expectEmit(true, true, false, true);
        emit IGroupVault.GroupCreated(1, a, "Japan trip", endsAt, WINDOW, 50 * USD);
        uint256 groupId = _create(50 * USD);

        assertEq(groupId, 1);
        IGroupVault.Group memory g = vault.getGroup(groupId);
        assertEq(g.creator, a);
        assertEq(g.inviteKey, invite);
        assertEq(g.disputeWindow, WINDOW);
        assertEq(vault.membersOf(groupId).length, 1);
        (,,, uint256 cap,,) = vault.positionOf(groupId, a);
        assertEq(cap, 500 * USD);
    }

    function test_createGroup_reverts() public {
        vm.startPrank(a);
        vm.expectRevert(IGroupVault.InvalidName.selector);
        vault.createGroup("", invite, endsAt, WINDOW, 0, 0);
        vm.expectRevert(IGroupVault.InvalidInvite.selector);
        vault.createGroup("x", address(0), endsAt, WINDOW, 0, 0);
        vm.expectRevert(IGroupVault.InvalidEndsAt.selector);
        vault.createGroup("x", invite, uint64(block.timestamp), WINDOW, 0, 0);
        vm.expectRevert(IGroupVault.InvalidDisputeWindow.selector);
        vault.createGroup("x", invite, endsAt, 31 days, 0, 0);
        vm.stopPrank();
    }

    function test_inviteDigest_matchesWhatAppsSign() public view {
        assertEq(vault.inviteDigest(7, b), _localInviteDigest(7, b));
        // Same vector computed by inviteDigest() in @tekosue/shared (viem) for this test setup.
        assertEq(address(vault), 0x2e234DAe75C793f67A35089C9d99245E1C58470b);
        assertEq(b, 0x0376AAc07Ad725E01357B1725B5ceC61aE10473c);
        assertEq(vault.inviteDigest(7, b), 0xb91892ea3e8d3433951c10b69d5d9072ce1096cdd5878b52f82a8c711ad92782);
    }

    function test_join_withInviteSignatureAndInitialDeposit() public {
        uint256 groupId = _create(0);
        vm.prank(b);
        vault.joinGroup(groupId, _inviteSig(groupId, b), 200 * USD, 100 * USD);

        assertEq(vault.membersOf(groupId).length, 2);
        assertEq(vault.getGroup(groupId).pool, 100 * USD);
        assertEq(ausd.balanceOf(address(vault)), 100 * USD);
    }

    function test_join_signatureIsBoundToTheJoiner() public {
        uint256 groupId = _create(0);
        bytes memory sigForB = _inviteSig(groupId, b);

        // Someone who saw B's transaction cannot reuse the signature.
        vm.prank(c);
        vm.expectRevert(IGroupVault.InvalidInvite.selector);
        vault.joinGroup(groupId, sigForB, 0, 0);

        // A wrong invite key is refused too.
        vm.prank(c);
        vm.expectRevert(IGroupVault.InvalidInvite.selector);
        vault.joinGroup(groupId, _inviteSigWith(0xBAD, groupId, c), 0, 0);

        vm.prank(b);
        vault.joinGroup(groupId, sigForB, 0, 0);
        vm.prank(b);
        vm.expectRevert(IGroupVault.AlreadyMember.selector);
        vault.joinGroup(groupId, sigForB, 0, 0);
    }

    function test_join_maxTenMembers() public {
        uint256 groupId = _create(0);
        for (uint256 i = 1; i < 10; i++) {
            address m = vm.addr(1000 + i);
            vm.prank(m);
            vault.joinGroup(groupId, _inviteSig(groupId, m), 0, 0);
        }
        address eleventh = vm.addr(2000);
        vm.prank(eleventh);
        vm.expectRevert(IGroupVault.GroupFull.selector);
        vault.joinGroup(groupId, _inviteSig(groupId, eleventh), 0, 0);
    }

    function test_join_afterEndsAt_reverts() public {
        uint256 groupId = _create(0);
        vm.warp(endsAt);
        vm.prank(b);
        vm.expectRevert(IGroupVault.GroupEnded.selector);
        vault.joinGroup(groupId, _inviteSig(groupId, b), 0, 0);
    }

    function test_joinGroupWithPermit_oneTransaction() public {
        uint256 groupId = _create(0);
        address d = vm.addr(0xD);
        ausd.mint(d, 300 * USD);
        uint256 value = 300 * USD; // initial deposit 100 + safety net 200
        IGroupVault.PermitSig memory permit = _permit(0xD, d, value);

        vm.prank(d);
        vault.joinGroupWithPermit(groupId, _inviteSig(groupId, d), 200 * USD, 100 * USD, permit);

        assertEq(vault.getGroup(groupId).pool, 100 * USD);
        assertEq(ausd.allowance(d, address(vault)), 200 * USD); // left for settle
    }

    function test_depositWithPermit_survivesFrontRunPermit() public {
        uint256 groupId = _create(0);
        address d = vm.addr(0xD);
        ausd.mint(d, 100 * USD);
        vm.prank(d);
        vault.joinGroup(groupId, _inviteSig(groupId, d), 0, 0);

        IGroupVault.PermitSig memory permit = _permit(0xD, d, 50 * USD);
        // Someone submits the permit first; the deposit must still go through.
        ausd.permit(d, address(vault), permit.value, permit.deadline, permit.v, permit.r, permit.s);
        vm.prank(d);
        vault.depositWithPermit(groupId, 50 * USD, permit);
        assertEq(vault.getGroup(groupId).pool, 50 * USD);
    }

    function _permit(uint256 key, address owner, uint256 value)
        internal
        view
        returns (IGroupVault.PermitSig memory p)
    {
        uint256 deadline = block.timestamp + 1 hours;
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
                ),
                owner,
                address(vault),
                value,
                ausd.nonces(owner),
                deadline
            )
        );
        bytes32 digest = MessageHashUtils.toTypedDataHash(ausd.DOMAIN_SEPARATOR(), structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
        p = IGroupVault.PermitSig({value: value, deadline: deadline, v: v, r: r, s: s});
    }

    // ---------------------------------------------------------------- deposit

    function test_deposit_reverts() public {
        uint256 groupId = _create(0);
        vm.prank(b);
        vm.expectRevert(IGroupVault.NotMember.selector);
        vault.deposit(groupId, 1);
        vm.prank(a);
        vm.expectRevert(IGroupVault.InvalidAmount.selector);
        vault.deposit(groupId, 0);
        vm.warp(endsAt);
        vm.prank(a);
        vm.expectRevert(IGroupVault.GroupEnded.selector);
        vault.deposit(groupId, 1);
    }

    // ---------------------------------------------------------------- spend

    function test_spend_underThreshold_paysImmediately() public {
        uint256 groupId = _groupOfThree(100 * USD);
        uint256 spendId = _spend(groupId, a, 90 * USD, _all(), _split(_all(), 30 * USD));

        IGroupVault.Spend memory s = vault.getSpend(groupId, spendId);
        assertEq(uint8(s.status), uint8(IGroupVault.SpendStatus.Executed));
        assertEq(ausd.balanceOf(shop), 90 * USD);
        assertEq(vault.getGroup(groupId).pool, 210 * USD);
        assertEq(_net(groupId, b), 70 * SUSD);
    }

    function test_spend_aboveThreshold_needsAnotherMember() public {
        uint256 groupId = _groupOfThree(50 * USD);
        address[] memory ps = _all();
        uint256[] memory shares = _split(ps, 50 * USD);

        vm.expectEmit(true, true, true, true);
        emit IGroupVault.SpendRequested(groupId, 0, a, shop, 150 * USD, ps, shares, keccak256("note"));
        uint256 spendId = _spend(groupId, a, 150 * USD, ps, shares);
        assertEq(ausd.balanceOf(shop), 0);

        vm.prank(a);
        vm.expectRevert(IGroupVault.CannotApproveOwnSpend.selector);
        vault.approveSpend(groupId, spendId);

        vm.prank(b);
        vault.approveSpend(groupId, spendId);
        assertEq(ausd.balanceOf(shop), 150 * USD);

        vm.prank(c);
        vm.expectRevert(IGroupVault.SpendNotPending.selector);
        vault.approveSpend(groupId, spendId);
    }

    function test_rejectSpend() public {
        uint256 groupId = _groupOfThree(50 * USD);
        uint256 spendId = _spend(groupId, a, 150 * USD, _all(), _split(_all(), 50 * USD));
        vm.prank(c);
        vault.rejectSpend(groupId, spendId);
        assertEq(uint8(vault.getSpend(groupId, spendId).status), uint8(IGroupVault.SpendStatus.Rejected));
        vm.prank(b);
        vm.expectRevert(IGroupVault.SpendNotPending.selector);
        vault.approveSpend(groupId, spendId);
    }

    function test_spend_reverts() public {
        uint256 groupId = _groupOfThree(1_000 * USD);
        address[] memory ps = _all();

        vm.prank(a);
        vm.expectRevert(IGroupVault.SharesMismatch.selector);
        vault.spend(groupId, shop, 90 * USD, ps, _split(ps, 20 * USD), bytes32(0));

        vm.prank(a);
        vm.expectRevert(IGroupVault.InsufficientPool.selector);
        vault.spend(groupId, shop, 301 * USD, _pair(a, b), _pair2(150 * USD, 151 * USD), bytes32(0));

        address[] memory outsider = _pair(a, shop);
        vm.prank(a);
        vm.expectRevert(IGroupVault.ParticipantNotMember.selector);
        vault.spend(groupId, shop, 20 * USD, outsider, _split(outsider, 10 * USD), bytes32(0));

        address[] memory dup = _pair(a, a);
        vm.prank(a);
        vm.expectRevert(IGroupVault.DuplicateParticipant.selector);
        vault.spend(groupId, shop, 20 * USD, dup, _split(dup, 10 * USD), bytes32(0));

        vm.prank(a);
        vm.expectRevert(IGroupVault.InvalidRecipient.selector);
        vault.spend(groupId, address(0), 30 * USD, ps, _split(ps, 10 * USD), bytes32(0));

        vm.prank(shop);
        vm.expectRevert(IGroupVault.NotMember.selector);
        vault.spend(groupId, shop, 30 * USD, ps, _split(ps, 10 * USD), bytes32(0));

        vm.warp(endsAt);
        vm.prank(a);
        vm.expectRevert(IGroupVault.GroupEnded.selector);
        vault.spend(groupId, shop, 30 * USD, ps, _split(ps, 10 * USD), bytes32(0));
    }

    function _pair2(uint256 x, uint256 y) internal pure returns (uint256[] memory v) {
        v = new uint256[](2);
        v[0] = x;
        v[1] = y;
    }

    // ---------------------------------------------------------------- dispute & receipts

    function test_disputeShare_movesShareToSpender() public {
        uint256 groupId = _groupOfThree(1_000 * USD);
        uint256 spendId = _spend(groupId, a, 90 * USD, _all(), _split(_all(), 30 * USD));

        vm.prank(b);
        vault.disputeShare(groupId, spendId);
        (, uint256 usedA,) = vault.balanceOf(groupId, a);
        (, uint256 usedB,) = vault.balanceOf(groupId, b);
        assertEq(usedA, 60 * USD);
        assertEq(usedB, 0);

        vm.prank(b);
        vm.expectRevert(IGroupVault.NotParticipant.selector);
        vault.disputeShare(groupId, spendId);
        vm.prank(a);
        vm.expectRevert(IGroupVault.NotParticipant.selector);
        vault.disputeShare(groupId, spendId);

        vm.warp(block.timestamp + WINDOW + 1);
        vm.prank(c);
        vm.expectRevert(IGroupVault.DisputeWindowClosed.selector);
        vault.disputeShare(groupId, spendId);
    }

    function test_attachReceipt_onlySpender() public {
        uint256 groupId = _groupOfThree(1_000 * USD);
        uint256 spendId = _spend(groupId, a, 90 * USD, _all(), _split(_all(), 30 * USD));
        vm.prank(b);
        vm.expectRevert(IGroupVault.NotSpender.selector);
        vault.attachReceipt(groupId, spendId, keccak256("cipher"));

        vm.expectEmit(true, true, true, true);
        emit IGroupVault.ReceiptAttached(groupId, spendId, a, keccak256("cipher"));
        vm.prank(a);
        vault.attachReceipt(groupId, spendId, keccak256("cipher"));

        vm.prank(a);
        vm.expectRevert(IGroupVault.SpendNotFound.selector);
        vault.attachReceipt(groupId, 99, keccak256("cipher"));
    }

    // ---------------------------------------------------------------- settle

    /// Spec example: A −10, B −10, C +20.
    function test_settle_specExample() public {
        uint256 groupId = _groupOfThree(1_000 * USD);
        _spend(groupId, a, 90 * USD, _all(), _split(_all(), 30 * USD));
        _spend(groupId, b, 60 * USD, _pair(a, b), _split(_pair(a, b), 30 * USD));
        _spend(groupId, c, 150 * USD, _all(), _split(_all(), 50 * USD));
        assertEq(vault.getGroup(groupId).pool, 0);
        assertEq(_net(groupId, a), -10 * SUSD);
        assertEq(_net(groupId, c), 20 * SUSD);

        uint256 aBefore = ausd.balanceOf(a);
        uint256 cBefore = ausd.balanceOf(c);
        vm.expectEmit(true, true, false, true);
        emit IGroupVault.Pulled(groupId, a, 10 * USD, 0);
        _settleNow(groupId);

        assertEq(aBefore - ausd.balanceOf(a), 10 * USD);
        assertEq(ausd.balanceOf(c) - cBefore, 20 * USD);
        assertEq(vault.getGroup(groupId).pool, 0);
        assertEq(uint8(vault.getGroup(groupId).status), uint8(IGroupVault.GroupStatus.Settled));
        assertEq(ausd.balanceOf(address(vault)), 0);
    }

    function test_settle_tooEarly_twice() public {
        uint256 groupId = _groupOfThree(0);
        vm.warp(uint256(endsAt) + WINDOW - 1);
        vm.expectRevert(IGroupVault.TooEarlyToSettle.selector);
        vault.settle(groupId);
        vm.warp(uint256(endsAt) + WINDOW);
        vault.settle(groupId);
        vm.expectRevert(IGroupVault.GroupNotActive.selector);
        vault.settle(groupId);
    }

    function test_settle_nonexistentGroup_reverts() public {
        vm.expectRevert(IGroupVault.GroupNotActive.selector);
        vault.settle(42);
    }

    function test_settle_pullNeverExceedsPullCap_restBecomesDebt() public {
        uint256 groupId = _create(1_000 * USD);
        vm.prank(a);
        vault.deposit(groupId, 10 * USD);
        vm.prank(b);
        vault.joinGroup(groupId, _inviteSig(groupId, b), 5 * USD, 10 * USD); // safety net only 5
        vm.prank(c);
        vault.joinGroup(groupId, _inviteSig(groupId, c), 0, 100 * USD);
        // B uses 60 alone → B net −50, but may only be pulled 5.
        address[] memory onlyB = new address[](1);
        onlyB[0] = b;
        uint256[] memory sixty = new uint256[](1);
        sixty[0] = 60 * USD;
        _spend(groupId, c, 60 * USD, onlyB, sixty);

        uint256 bBefore = ausd.balanceOf(b);
        _settleNow(groupId);
        assertEq(bBefore - ausd.balanceOf(b), 5 * USD);
        assertEq(_debt(groupId, b), 45 * USD);
        // A (+10) and C (+100) share the 55 in the pool proportionally; the rest is credit.
        assertEq(_credit(groupId, a) + _credit(groupId, c), 45 * USD);
        _assertSettledInvariant(groupId);

        // B pays the debt later; it goes straight to the creditors.
        uint256 aBefore = ausd.balanceOf(a);
        uint256 cBefore = ausd.balanceOf(c);
        vm.prank(b);
        vault.payDebt(groupId, 100 * USD); // capped at the debt
        assertEq(_debt(groupId, b), 0);
        assertEq(_credit(groupId, a) + _credit(groupId, c), 0);
        assertEq((ausd.balanceOf(a) - aBefore) + (ausd.balanceOf(c) - cBefore), 45 * USD);
        _assertSettledInvariant(groupId);

        vm.prank(b);
        vm.expectRevert(IGroupVault.NoDebt.selector);
        vault.payDebt(groupId, 1);
    }

    function test_payDebtWithPermit_oneTransaction() public {
        uint256 groupId = _create(1_000 * USD);
        vm.prank(a);
        vault.deposit(groupId, 50 * USD);
        address d = vm.addr(0xD);
        ausd.mint(d, 100 * USD);
        IGroupVault.PermitSig memory joinPermit = _permit(0xD, d, 10 * USD);
        vm.prank(d);
        vault.joinGroupWithPermit(groupId, _inviteSig(groupId, d), 0, 10 * USD, joinPermit); // no safety net
        address[] memory onlyD = new address[](1);
        onlyD[0] = d;
        uint256[] memory forty = new uint256[](1);
        forty[0] = 40 * USD;
        _spend(groupId, a, 40 * USD, onlyD, forty);

        _settleNow(groupId);
        assertEq(_debt(groupId, d), 30 * USD);

        IGroupVault.PermitSig memory payPermit = _permit(0xD, d, 30 * USD);
        uint256 aBefore = ausd.balanceOf(a);
        vm.prank(d);
        vault.payDebtWithPermit(groupId, 30 * USD, payPermit);
        assertEq(_debt(groupId, d), 0);
        assertEq(ausd.balanceOf(a) - aBefore, 30 * USD);
        _assertSettledInvariant(groupId);
    }

    function test_settle_frozenDebtor_doesNotBlockOthers() public {
        uint256 groupId = _groupOfThree(1_000 * USD);
        _spend(groupId, a, 90 * USD, _all(), _split(_all(), 30 * USD));
        _spend(groupId, b, 60 * USD, _pair(a, b), _split(_pair(a, b), 30 * USD));
        _spend(groupId, c, 150 * USD, _all(), _split(_all(), 50 * USD));

        ausd.freeze(a, true);
        uint256 cBefore = ausd.balanceOf(c);
        _settleNow(groupId); // must not revert

        assertEq(_debt(groupId, a), 10 * USD);
        assertEq(_debt(groupId, b), 0);
        assertEq(ausd.balanceOf(c) - cBefore, 10 * USD); // only B's 10 was available
        assertEq(_credit(groupId, c), 10 * USD);
        _assertSettledInvariant(groupId);
    }

    function test_settle_frozenCreditor_fundsHeldUntilClaimed() public {
        uint256 groupId = _groupOfThree(1_000 * USD);
        _spend(groupId, a, 90 * USD, _all(), _split(_all(), 30 * USD));
        _spend(groupId, b, 60 * USD, _pair(a, b), _split(_pair(a, b), 30 * USD));
        _spend(groupId, c, 150 * USD, _all(), _split(_all(), 50 * USD));

        ausd.freeze(c, true);
        _settleNow(groupId);
        assertEq(_credit(groupId, c), 20 * USD);
        assertEq(vault.getGroup(groupId).pool, 20 * USD);
        _assertSettledInvariant(groupId);

        vm.prank(c);
        vm.expectRevert(); // still frozen
        vault.claimCredit(groupId);

        ausd.freeze(c, false);
        uint256 cBefore = ausd.balanceOf(c);
        vm.prank(c);
        vault.claimCredit(groupId);
        assertEq(ausd.balanceOf(c) - cBefore, 20 * USD);
        assertEq(vault.getGroup(groupId).pool, 0);

        vm.prank(c);
        vm.expectRevert(IGroupVault.NoCredit.selector);
        vault.claimCredit(groupId);
    }

    function test_settle_revokedAllowance_becomesDebt() public {
        uint256 groupId = _groupOfThree(1_000 * USD);
        _spend(groupId, a, 90 * USD, _all(), _split(_all(), 30 * USD));
        _spend(groupId, b, 60 * USD, _pair(a, b), _split(_pair(a, b), 30 * USD));
        _spend(groupId, c, 150 * USD, _all(), _split(_all(), 50 * USD));
        vm.prank(b);
        ausd.approve(address(vault), 3 * USD);

        _settleNow(groupId);
        assertEq(_debt(groupId, b), 7 * USD);
        _assertSettledInvariant(groupId);
    }

    function _assertSettledInvariant(uint256 groupId) internal view {
        address[] memory ms = vault.membersOf(groupId);
        uint256 debts;
        uint256 credits;
        for (uint256 i = 0; i < ms.length; i++) {
            debts += _debt(groupId, ms[i]);
            credits += _credit(groupId, ms[i]);
        }
        uint256 pool = vault.getGroup(groupId).pool;
        assertEq(credits, debts + pool, "credit == debt + pool");
        assertEq(ausd.balanceOf(address(vault)), pool, "vault holds exactly the pool");
    }

    // ---------------------------------------------------------------- fuzz: conservation of value

    function testFuzz_conservation(uint96[3] memory deposits, uint96[4] memory amounts, uint8 spenderSeed)
        public
    {
        uint256 groupId = _create(type(uint256).max);
        vm.prank(b);
        vault.joinGroup(groupId, _inviteSig(groupId, b), type(uint256).max, 0);
        vm.prank(c);
        vault.joinGroup(groupId, _inviteSig(groupId, c), type(uint256).max, 0);
        address[] memory ps = _all();

        for (uint256 i = 0; i < 3; i++) {
            uint256 amount = bound(deposits[i], 1, 300 * USD);
            vm.prank(ps[i]);
            vault.deposit(groupId, amount);
        }
        for (uint256 i = 0; i < amounts.length; i++) {
            uint256 pool = vault.getGroup(groupId).pool;
            if (pool < 3) break;
            uint256 amount = bound(amounts[i], 3, pool);
            uint256[] memory shares = new uint256[](3);
            shares[0] = amount / 3;
            shares[1] = amount / 3;
            shares[2] = amount - 2 * (amount / 3);
            _spend(groupId, ps[(spenderSeed + i) % 3], amount, ps, shares);

            int256 sumNet = _net(groupId, a) + _net(groupId, b) + _net(groupId, c);
            assertEq(sumNet, int256(vault.getGroup(groupId).pool), "sum(net) == pool");
            assertEq(ausd.balanceOf(address(vault)), vault.getGroup(groupId).pool, "pool == vault balance");
        }

        uint256 totalBefore = ausd.balanceOf(a) + ausd.balanceOf(b) + ausd.balanceOf(c)
            + ausd.balanceOf(address(vault)) + ausd.balanceOf(shop);
        _settleNow(groupId);
        uint256 totalAfter = ausd.balanceOf(a) + ausd.balanceOf(b) + ausd.balanceOf(c)
            + ausd.balanceOf(address(vault)) + ausd.balanceOf(shop);
        assertEq(totalAfter, totalBefore, "no AUSD created or lost");
        _assertSettledInvariant(groupId);
    }

    // ---------------------------------------------------------------- reentrancy

    function test_reentrancy_blocked() public {
        ReentrantToken evil = new ReentrantToken();
        GroupVault evilVault = new GroupVault(IERC20(address(evil)));
        vm.prank(a);
        uint256 groupId = evilVault.createGroup("x", invite, endsAt, WINDOW, 0, 0);
        evil.mint(a, 100);
        vm.prank(a);
        evil.approve(address(evilVault), type(uint256).max);
        evil.arm(evilVault, groupId);

        vm.prank(a);
        vm.expectRevert();
        evilVault.deposit(groupId, 10);
    }
}
