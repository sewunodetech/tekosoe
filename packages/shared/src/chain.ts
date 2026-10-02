import { encodeAbiParameters, keccak256, parseAbi, type Address, type Hex } from "viem";
import { monadTestnet } from "viem/chains";

export { monadTestnet };

export const MONAD_TESTNET_CHAIN_ID = 10143;

/** Maksimal anggota per grup; settle-up berjalan dalam satu transaksi dengan loop sederhana. */
export const MAX_GROUP_MEMBERS = 10;

/** GroupVault v1 (ADR 0005) di Monad testnet — deploy 30 Sep 2026, blok 66921819. */
export const GROUP_VAULT_TESTNET_ADDRESS = "0x1467c9de54C1e4570AF062E80E860F94852BB7ee" as const;
export const GROUP_VAULT_TESTNET_START_BLOCK = 66921819;

/**
 * AUSD (Agora Dollar) di Monad testnet — terverifikasi 30 Sep 2026 di
 * https://docs.agora.finance/developer/contract-deployments dan on-chain:
 * 6 desimal, EIP-2612 permit (domain "Agora Dollar" v1), EIP-3009, `isAccountFrozen`, proxy upgradeable.
 */
export const AUSD_TESTNET_ADDRESS = "0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC" as const;

/**
 * Faucet AUSD testnet Agora (proxy). `requestFunds(recipient)` — dilaporkan 10.000 AUSD per panggilan,
 * sekali per menit. Hanya testnet; di UI sebut "Add demo funds", bukan "faucet".
 */
export const AUSD_TESTNET_FAUCET_ADDRESS = "0xd236c18D274E54FAccC3dd9DDA4b27965a73ee6C" as const;
export const ausdFaucetAbi = parseAbi(["function requestFunds(address recipient)"]);

/** Bagian ERC-20 + EIP-2612 AUSD yang dipakai app. */
export const ausdAbi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function nonces(address owner) view returns (uint256)",
  "function isAccountFrozen(address account) view returns (bool)",
]);

/**
 * Typed data EIP-2612 untuk `permit` AUSD ke GroupVault. Hasilnya ditandatangani akun Mera
 * (hashTypedData → signDigest) lalu dipecah ke v/r/s untuk `joinGroupWithPermit` / `depositWithPermit`.
 */
export function ausdPermitTypedData(params: {
  chainId: number;
  ausd: Address;
  owner: Address;
  spender: Address;
  value: bigint;
  nonce: bigint;
  deadline: bigint;
}) {
  return {
    domain: { name: "Agora Dollar", version: "1", chainId: params.chainId, verifyingContract: params.ausd },
    types: {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit" as const,
    message: {
      owner: params.owner,
      spender: params.spender,
      value: params.value,
      nonce: params.nonce,
      deadline: params.deadline,
    },
  };
}

/**
 * Digest undangan (ADR 0005), identik dengan `GroupVault.inviteDigest`:
 * keccak256(abi.encode(vault, chainId, groupId, joiner)). Kunci undangan menandatanganinya
 * dengan EIP-191: `privateKeyToAccount(inviteSecret).signMessage({ message: { raw: digest } })`.
 */
export function inviteDigest(vault: Address, chainId: number, groupId: bigint, joiner: Address): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "uint256" }, { type: "uint256" }, { type: "address" }],
      [vault, BigInt(chainId), groupId, joiner],
    ),
  );
}
