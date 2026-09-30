import type { Address } from "viem";
import { createApp, createRouteContext } from "./app";
import { createChainService } from "./chain/groupVault";
import { isRelaxedEnv, loadEnv } from "./config/env";
import type { AppDeps } from "./context";
import { createDb, createPool, pingDb } from "./db/client";
import { createRepos } from "./db/repos";
import { createEnvioClient } from "./integrations/envio";
import { createStorageService } from "./integrations/storage";
import { createPushService } from "./integrations/expoPush";
import { createLogger, type Logger } from "./lib/logger";
import { checksumAddress } from "./lib/address";
import { startNonceCleanup } from "./modules/auth/service";
import { startReceiptCleanup } from "./modules/receipts/service";
import { startSettleScheduler } from "./modules/settle/scheduler";
import { createSchedulerState } from "./modules/settle/state";

interface BackgroundJob {
  stop(): void;
}

/**
 * Fail-fast startup checks (spec 5.0): database reachable, RPC chain id matches
 * CHAIN_ID, contract code present at GROUP_VAULT_ADDRESS. Any failure stops the
 * process with a readable message before a single request is accepted.
 *
 * With RELAXED_ENV=true every failure is only logged as a warning and the server
 * keeps booting, so the app can be explored before the environment is complete.
 */
async function runStartupChecks(options: {
  pool: ReturnType<typeof createPool>;
  chain: ReturnType<typeof createChainService>;
  env: ReturnType<typeof loadEnv>;
  logger: Logger;
  relaxed: boolean;
}): Promise<void> {
  const { pool, chain, env, logger, relaxed } = options;

  const fail = (message: string): void => {
    if (relaxed) {
      logger.warn({ message }, "startup check failed (RELAXED_ENV=true), continuing");
      return;
    }
    throw new Error(message);
  };

  try {
    await pool.query("select 1");
  } catch (error) {
    fail(
      `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  let chainId: number | null = null;
  try {
    chainId = await chain.getChainId();
  } catch (error) {
    fail(`RPC is unreachable: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (chainId !== null && chainId !== env.CHAIN_ID) {
    fail(`RPC reports chain id ${chainId}, expected CHAIN_ID ${env.CHAIN_ID}`);
  }

  let hasCode = false;
  try {
    hasCode = await chain.hasContractCode(env.GROUP_VAULT_ADDRESS as Address);
  } catch (error) {
    fail(
      `Contract check failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!hasCode) {
    fail(
      `No contract code at GROUP_VAULT_ADDRESS ${checksumAddress(env.GROUP_VAULT_ADDRESS)}`,
    );
  }

  logger.info(
    {
      chainId,
      groupVault: checksumAddress(env.GROUP_VAULT_ADDRESS),
      drip: chain.dripAddress,
      settler: chain.settlerAddress,
      features: {
        receipts: env.FEATURE_RECEIPTS,
        push: env.FEATURE_PUSH,
      },
      relaxed,
    },
    "startup checks passed",
  );
}

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger({ level: process.env["LOG_LEVEL"] });

  const pool = createPool(env.DATABASE_URL, (error) =>
    logger.warn({ err: error }, "idle database connection dropped; the pool will reconnect"),
  );
  const db = createDb(pool);
  const repos = createRepos(db);
  const chain = createChainService({ env, logger });
  const envio = createEnvioClient(env);

  const deps: AppDeps = {
    env,
    logger,
    repos,
    chain,
    envio,
    storage: env.FEATURE_RECEIPTS ? createStorageService(env) : undefined,
    push: env.FEATURE_PUSH ? createPushService(env) : undefined,
    scheduler: createSchedulerState(),
    pingDb: async () => {
      try {
        return { ok: true, latencyMs: await pingDb(pool) };
      } catch (error) {
        return {
          ok: false,
          latencyMs: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };

  await runStartupChecks({ pool, chain, env, logger, relaxed: isRelaxedEnv() });

  const ctx = createRouteContext(deps);
  const app = createApp(ctx);

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "listening");
  });

  // In-process jobs (spec: setInterval, not cron). Every one of them is stopped on shutdown.
  const jobs: BackgroundJob[] = [startSettleScheduler(ctx), startNonceCleanup(ctx)];
  if (env.FEATURE_RECEIPTS) {
    jobs.push(startReceiptCleanup(ctx));
  }

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "shutting down");

    for (const job of jobs) {
      try {
        job.stop();
      } catch (error) {
        logger.warn({ err: error }, "could not stop a background job");
      }
    }

    server.close(() => {
      void pool
        .end()
        .then(() => {
          logger.info("shutdown complete");
          process.exit(0);
        })
        .catch((error: unknown) => {
          logger.error({ err: error }, "error while closing the pool");
          process.exit(1);
        });
    });

    // Do not hang forever behind a stuck connection.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  // Configuration problems must be readable without a stack trace.
  console.error(`Fatal: ${message}`);
  process.exit(1);
});
