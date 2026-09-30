import { Router } from "express";
import { z } from "zod";
import type { RouteContext } from "../../context";
import { ADDRESS_PATTERN } from "../../lib/address";
import { normalizeAddress } from "../../lib/address";
import { apiRateLimit, MINUTE_MS } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validate";
import { createChallenge, verifyChallenge } from "./service";

const challengeBodySchema = z.object({
  address: z.string().regex(ADDRESS_PATTERN, "must be a 0x-prefixed address"),
});

const verifyBodySchema = z.object({
  address: z.string().regex(ADDRESS_PATTERN, "must be a 0x-prefixed address"),
  signature: z
    .string()
    .max(1030)
    .regex(/^0x[0-9a-fA-F]+$/, "must be a hex signature"),
});

export function createAuthRoutes(ctx: RouteContext): Router {
  const router = Router();
  const limit = apiRateLimit({
    windowMs: MINUTE_MS,
    max: 30,
    code: "RATE_LIMITED",
    message: "Too many requests, try again shortly",
  });

  router.post("/challenge", limit, validate({ body: challengeBodySchema }), async (req, res) => {
    const address = normalizeAddress(req.body.address as string);
    res.json(await createChallenge(ctx, address));
  });

  router.post("/verify", limit, validate({ body: verifyBodySchema }), async (req, res) => {
    const address = normalizeAddress(req.body.address as string);
    const result = await verifyChallenge(ctx, {
      address,
      signature: req.body.signature as string,
    });
    res.json(result);
  });

  return router;
}
