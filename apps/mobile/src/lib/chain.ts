import { createPublicClient, http } from 'viem';
import { monadTestnet } from '@tekosoe/shared';

import { env } from './env';

// Hanya untuk membaca kontrak (cek ulang saldo sebelum transaksi penting).
// Transaksi ditandatangani lewat Mera — belum dipasang, lihat apps/mobile/AGENTS.md.
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(env.monadRpcUrl),
});
