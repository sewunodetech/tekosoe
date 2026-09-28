import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { MONAD_TESTNET_CHAIN_ID } from "@tekosoe/shared";
import { env } from "./env";
import { startSettleScheduler } from "./jobs/settleScheduler";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, chainId: MONAD_TESTNET_CHAIN_ID }));

// TODO (P0): rute metadata — setiap permintaan wajib pesan bertanda tangan EIP-191 dari alamat anggota
// dan cek keanggotaan on-chain sebelum baca/tulis database. Lihat apps/api/AGENTS.md.
// TODO (P0): POST /onboarding/drip — kirim sedikit MON ke akun baru (cadangan gas).

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`tekosoe api listening on :${info.port}`);
});

startSettleScheduler();
