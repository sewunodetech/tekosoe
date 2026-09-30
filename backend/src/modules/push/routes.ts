import { Router } from "express";
import { z } from "zod";
import type { RouteContext } from "../../context";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";

const subscribeBodySchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(512),
  }),
});

const unsubscribeBodySchema = z.object({
  endpoint: z.string().url().max(2048),
});

export function createPushRoutes(ctx: RouteContext): Router {
  const router = Router();

  // Public: the app needs it to create a subscription.
  router.get("/vapid-public-key", (_req, res) => {
    res.json({ publicKey: ctx.env.VAPID_PUBLIC_KEY });
  });

  router.post(
    "/subscribe",
    requireAuth(ctx.env),
    validate({ body: subscribeBodySchema }),
    async (req, res) => {
      const body = req.body as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      await ctx.repos.pushSubscriptions.upsert({
        address: req.auth!.address,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      });
      res.status(201).json({ ok: true });
    },
  );

  router.delete(
    "/subscribe",
    requireAuth(ctx.env),
    validate({ body: unsubscribeBodySchema }),
    async (req, res) => {
      await ctx.repos.pushSubscriptions.deleteByEndpoint(req.body.endpoint as string);
      res.json({ ok: true });
    },
  );

  return router;
}
