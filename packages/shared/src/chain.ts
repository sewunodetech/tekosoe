import { monadTestnet } from "viem/chains";

export { monadTestnet };

export const MONAD_TESTNET_CHAIN_ID = 10143;

/** Maksimal anggota per grup; settle-up berjalan dalam satu transaksi dengan loop sederhana. */
export const MAX_GROUP_MEMBERS = 10;

/**
 * AUSD di Monad testnet dari catatan peserta lain.
 * BELUM DIVERIFIKASI — cocokkan dengan halaman contract deployments Agora sebelum dipakai.
 */
export const AUSD_TESTNET_ADDRESS = "0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC" as const;
