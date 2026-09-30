import { createHash, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { Env } from "../config/env";
import { errors } from "../lib/errors";

/** Compare digests so the comparison is constant time regardless of key length. */
function matches(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Guards /api/admin/* and /api/status with the x-admin-key header. */
export function requireAdmin(env: Env) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!env.ADMIN_API_KEY) {
      next(
        errors.forbidden("ADMIN_KEY_NOT_CONFIGURED", "Admin access is not configured"),
      );
      return;
    }
    const given = req.get("x-admin-key") ?? "";
    if (!matches(given, env.ADMIN_API_KEY)) {
      next(errors.forbidden("FORBIDDEN", "Invalid admin key"));
      return;
    }
    next();
  };
}
