import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { MONAD_TESTNET_CHAIN_ID } from "@tekosoe/shared";
import { env } from "./env";
import { startSettleScheduler } from "./jobs/settleScheduler";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, chainId: MONAD_TESTNET_CHAIN_ID }));

// Push subscription endpoint (M11)
app.post("/notifications/subscribe", async (c) => {
  try {
    const body = await c.req.json();
    const { address, expoPushToken, platform } = body;
    if (!address || !expoPushToken) {
      return c.json({ ok: false, error: "Missing address or expoPushToken" }, 400);
    }
    // TODO (M11): simpan ke push_subs saat DB driver terpasang
    console.log(`[Push Subscription] Registered token for ${address} (${platform ?? "unknown"})`);
    return c.json({ ok: true, subscribed: true });
  } catch {
    return c.json({ ok: false, error: "Invalid JSON" }, 400);
  }
});

// TODO (P0): rute metadata — setiap permintaan wajib pesan bertanda tangan EIP-191 dari alamat anggota
// dan cek keanggotaan on-chain sebelum baca/tulis database. Lihat apps/api/AGENTS.md.
// TODO (P0): POST /onboarding/drip — kirim sedikit MON ke akun baru (cadangan gas).

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`tekosoe api listening on :${info.port}`);
});

startSettleScheduler();
