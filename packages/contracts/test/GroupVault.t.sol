// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {GroupVault} from "../src/GroupVault.sol";

/// @dev Token uji dengan 6 desimal seperti AUSD. Hanya untuk test — integrasi nyata memakai AUSD testnet.
contract MockAUSD is ERC20 {
    constructor() ERC20("Mock AUSD", "mAUSD") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract GroupVaultTest is Test {
    MockAUSD internal ausd;
    GroupVault internal vault;

    address internal a = makeAddr("A");
    address internal b = makeAddr("B");
    address internal c = makeAddr("C");

    function setUp() public {
        ausd = new MockAUSD();
        vault = new GroupVault(ausd);
    }

    function test_balanceOf_emptyGroup() public view {
        (uint256 dep, uint256 usedAmt, int256 net) = vault.balanceOf(0, a);
        assertEq(dep, 0);
        assertEq(usedAmt, 0);
        assertEq(net, 0);
    }

    // TODO (lihat docs/07-rencana-pengembangan.md › Rencana uji › Kontrak):
    // - contoh A, B, C di Spesifikasi Teknis: A −10, B −10, C +20
    // - revert: bukan anggota, kas kurang, setelah endsAt, shares != amount, approve spend sendiri,
    //   dispute setelah jendela, settle terlalu cepat / dua kali
    // - settle: tarikan tidak pernah > pullCap; kekurangan jadi debt
    // - fuzz/invariant: sum(deposited - used) == pool == saldo AUSD vault
    // - reentrancy dengan token berbahaya
}
