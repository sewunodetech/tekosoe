import type { Env } from "./config/env";
import type { ChainService } from "./chain/groupVault";
import type { Repos } from "./db/repos";
import type { EnvioClient } from "./integrations/envio";
import type { PushService } from "./integrations/expoPush";
import type { StorageService } from "./integrations/storage";
import type { Logger } from "./lib/logger";
import type { MembershipChecker } from "./middleware/auth";
import type { SchedulerState } from "./modules/settle/state";

/** Everything the HTTP layer needs, injected so tests can replace any of it. */
export interface AppDeps {
  env: Env;
  logger: Logger;
  repos: Repos;
  chain: ChainService;
  envio: EnvioClient;
  storage?: StorageService;
  push?: PushService;
  scheduler: SchedulerState;
  /** DB connectivity probe for /api/status (real pool in production, fake in tests). */
  pingDb?: () => Promise<{ ok: boolean; latencyMs: number | null; error?: string }>;
  /** Test hook: lets webhook tests await background processing. */
  onWebhookWork?: (work: Promise<unknown>) => void;
}

/** AppDeps plus the on-chain membership checker built inside createApp. */
export interface RouteContext extends AppDeps {
  membership: MembershipChecker;
}
