import { Router } from "express";
import { z } from "zod";
import type { RouteContext } from "../../context";
import { ADDRESS_PATTERN } from "../../lib/address";
import { errors } from "../../lib/errors";
import { apiRateLimit, HOUR_MS } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validate";
import { requestDrip } from "./service";

const dripBodySchema = z.object({
  address: z.string().regex(ADDRESS_PATTERN, "must be a 0x-prefixed address"),
});

export function createOnboardingRoutes(ctx: RouteContext): Router {
  const router = Router();

  router.post(
    "/drip",
    apiRateLimit({
      windowMs: HOUR_MS,
      max: ctx.env.DRIP_RATE_LIMIT_PER_HOUR,
      code: "DRIP_LIMIT_REACHED",
      message: "Too many attempts from this address, try again later",
    }),
    validate({ body: dripBodySchema }),
    async (req, res) => {
      const address = String(req.body.address as string).toLowerCase();
      const outcome = await requestDrip(ctx, address);

      if (outcome.status === "limit_reached") {
        throw errors.tooManyRequests(
          "DRIP_LIMIT_REACHED",
          "Daily limit reached, try again later",
        );
      }
      if (outcome.status === "in_progress") {
        throw errors.conflict("DRIP_IN_PROGRESS", "An earlier request is still in progress");
      }
      if (outcome.status === "failed") {
        throw errors.badGateway("DRIP_FAILED", "We could not prepare this account yet, try again");
      }

      res.json(outcome);
    },
  );

  return router;
}
