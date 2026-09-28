// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IGroupVault} from "./interfaces/IGroupVault.sol";

/// @title GroupVault
/// @notice SKELETON — storage dan signature sudah sesuai spesifikasi, logika belum diimplementasi.
/// Aturan: setiap fungsi yang memindahkan AUSD memakai nonReentrant + SafeERC20 dan mengubah state
/// sebelum transfer. Lihat packages/contracts/AGENTS.md.
contract GroupVault is IGroupVault, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_MEMBERS = 10;

    IERC20 public immutable ausd;

    uint256 public groupCount;

    mapping(uint256 => Group) internal groups;
    mapping(uint256 => address[]) internal members;
    mapping(uint256 => mapping(address => bool)) internal isMember;
    mapping(uint256 => mapping(address => uint256)) internal deposited;
    mapping(uint256 => mapping(address => uint256)) internal used;
    mapping(uint256 => mapping(address => uint256)) internal pullCap; // batas izin tarik saat settle
    mapping(uint256 => Spend[]) internal spends;
    mapping(uint256 => mapping(uint256 => address[])) internal spendParticipants;
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) internal shareOf;
    mapping(uint256 => mapping(address => uint256)) internal debt; // sisa tagihan setelah settle
    mapping(uint256 => mapping(address => uint256)) internal credit; // sisa hak yang belum terbayar

    error NotImplemented();

    constructor(IERC20 ausd_) {
        ausd = ausd_;
    }

    // ---------------------------------------------------------------- mutations

    function createGroup(string calldata, bytes32, uint64, uint64, uint256) external returns (uint256) {
        revert NotImplemented();
    }

    function joinGroup(uint256, bytes32, uint256) external {
        revert NotImplemented();
    }

    function deposit(uint256, uint256) external nonReentrant {
        revert NotImplemented();
    }

    function spend(uint256, address, uint256, address[] calldata, uint256[] calldata, bytes32)
        external
        nonReentrant
        returns (uint256)
    {
        revert NotImplemented();
    }

    function approveSpend(uint256, uint256) external nonReentrant {
        revert NotImplemented();
    }

    function rejectSpend(uint256, uint256) external {
        revert NotImplemented();
    }

    function disputeShare(uint256, uint256) external {
        revert NotImplemented();
    }

    function settle(uint256) external nonReentrant {
        revert NotImplemented();
    }

    function payDebt(uint256, uint256) external nonReentrant {
        revert NotImplemented();
    }

    function attachReceipt(uint256, uint256, bytes32) external {
        revert NotImplemented();
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
        net = int256(deposited_) - int256(used_);
    }

    function getSpend(uint256 groupId, uint256 spendId) external view returns (Spend memory) {
        return spends[groupId][spendId];
    }
}
