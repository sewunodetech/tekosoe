import { randomUUID } from "node:crypto";
import cors from "cors";
import express, { type Express, type Request } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { corsOrigins } from "./config/env";
import type { AppDeps, RouteContext } from "./context";
import { createMembershipChecker } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { createHealthRoutes, livenessHandler } from "./modules/health/routes";
import { createOnboardingRoutes } from "./modules/onboarding/routes";
import { createAuthRoutes } from "./modules/auth/routes";
import { createProfileRoutes } from "./modules/profiles/routes";
import { createGroupReceiptRoutes, createReceiptRoutes } from "./modules/receipts/routes";
import { createGroupKeysRoutes, createKeysRoutes } from "./modules/keys/routes";
import { createPushRoutes } from "./modules/push/routes";
import { createWebhookRoutes } from "./modules/webhooks/routes";
import { createAdminRoutes } from "./modules/settle/routes";
import { createDocsRoutes } from "./modules/docs/routes";

/** AppDeps plus the on-chain membership checker shared by every route. */
export function createRouteContext(deps: AppDeps): RouteContext {
  return { ...deps, membership: createMembershipChecker({ chain: deps.chain }) };
}

/**
 * The whole HTTP surface. Middleware order matters:
 * proxy → security → CORS → request id → access log → raw webhooks → JSON → routers → 404.
 */
export function createApp(ctx: RouteContext): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());

  const allowlist = corsOrigins(ctx.env);
  app.use(
    cors({
      origin: (origin, callback) => {
        // No Origin header: native clients, curl, server-to-server. Empty allowlist: open.
        if (!origin || allowlist.length === 0 || allowlist.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: false,
    }),
  );

  app.use((req, res, next) => {
    req.id = String(req.get("x-request-id") ?? randomUUID()).slice(0, 64);
    res.setHeader("x-request-id", req.id);
    next();
  });

  app.use(
    pinoHttp({
      logger: ctx.logger,
      genReqId: (req) => (req as Request).id ?? randomUUID(),
      // Railway probes /health constantly; keep it out of the access log.
      autoLogging: { ignore: (req) => req.url === "/health" },
    }),
  );

  app.get("/health", livenessHandler);

  // Webhook first: it needs the raw body, so it must run before express.json.
  if (ctx.env.FEATURE_PUSH) {
    app.use("/api/webhooks", createWebhookRoutes(ctx));
  }

  app.use(express.json({ limit: "100kb" }));

  app.use("/api", createHealthRoutes(ctx));
  app.use("/api", createOnboardingRoutes(ctx));
  app.use("/api/auth", createAuthRoutes(ctx));
  app.use("/api/profiles", createProfileRoutes(ctx));
  app.use("/api/admin", createAdminRoutes(ctx));
  app.use("/api", createDocsRoutes());

  if (ctx.env.FEATURE_RECEIPTS) {
    app.use("/api/receipts", createReceiptRoutes(ctx));
    app.use("/api/groups", createGroupReceiptRoutes(ctx));
    app.use("/api/keys", createKeysRoutes(ctx));
    app.use("/api/groups", createGroupKeysRoutes(ctx));
  }

  if (ctx.env.FEATURE_PUSH) {
    app.use("/api/push", createPushRoutes(ctx));
  }

  app.use(notFoundHandler);
  app.use(errorHandler(ctx.logger));

  return app;
}
