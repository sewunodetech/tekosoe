import type { Address, LocalAccount } from 'viem';

/**
 * Akun yang menandatangani di perangkat. Kunci tidak pernah keluar dari HP.
 * `account` adalah LocalAccount viem: EIP-191 (login api, undangan), EIP-712 (permit AUSD),
 * dan transaksi ke GroupVault.
 */
export interface Signer {
  readonly address: Address;
  readonly account: LocalAccount;
  /** Tutup sesi tanda tangan (hapus kunci dari memori). */
  end(): void;
}
