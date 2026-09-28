// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {GroupVault} from "../src/GroupVault.sol";

/// forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast
/// Butuh env: DEPLOYER_PRIVATE_KEY, AUSD_ADDRESS (verifikasi alamat AUSD di dokumentasi Agora dulu).
contract Deploy is Script {
    function run() external returns (GroupVault vault) {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address ausd = vm.envAddress("AUSD_ADDRESS");

        vm.startBroadcast(pk);
        vault = new GroupVault(IERC20(ausd));
        vm.stopBroadcast();

        console.log("GroupVault:", address(vault));
    }
}
