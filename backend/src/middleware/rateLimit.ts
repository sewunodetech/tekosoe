import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { Request } from "express";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  code: string;
  message: string;
  /** Defaults to the caller IP (requires `trust proxy`). */
  keyGenerator?: (req: Request) => string;
}

/** Rate limiter that answers with the standard error envelope. */
export function apiRateLimit(options: RateLimitOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator ?? ((req: Request) => ipKeyGenerator(req.ip ?? "unknown")),
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: options.code, message: options.message, details: {} },
      });
    },
  });
}

export const HOUR_MS = 60 * 60 * 1000;
export const MINUTE_MS = 60 * 1000;
