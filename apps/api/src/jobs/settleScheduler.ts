/**
 * Penjadwal settle-up: memanggil `settle(groupId)` tepat setelah endsAt + disputeWindow.
 * Backend hanya membayar gas — tidak pernah memegang kunci atau dana user.
 * Siapa pun anggota juga bisa memanggil `settle` sebagai cadangan.
 *
 * TODO (P0): ambil grup Active yang sudah jatuh tempo dari Envio, kirim transaksi settle,
 * lalu buat baris `invoices` per anggota dari event Settled/Pulled/Refunded.
 */
export function startSettleScheduler(intervalMs = 30_000): NodeJS.Timeout {
  return setInterval(() => {
    // sengaja kosong sampai kontrak dan indexer siap
  }, intervalMs);
}
