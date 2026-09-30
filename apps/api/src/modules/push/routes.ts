import { Router } from "express";
import { z } from "zod";
import type { RouteContext } from "../../context";
import { EXPO_PUSH_TOKEN_PATTERN } from "../../integrations/expoPush";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate";

const tokenSchema = z
  .string()
  .max(255)
  .regex(EXPO_PUSH_TOKEN_PATTERN, "must be an Expo push token");

const subscribeBodySchema = z.object({
  expoPushToken: tokenSchema,
  platform: z.enum(["ios", "android"]),
});

const unsubscribeBodySchema = z.object({
  expoPushToken: tokenSchema,
});

/** /api/push — register the device's Expo push token for the signed-in account. */
export function createPushRoutes(ctx: RouteContext): Router {
  const router = Router();
  router.use(requireAuth(ctx.env));

  router.post("/subscribe", validate({ body: subscribeBodySchema }), async (req, res) => {
    const body = req.body as z.infer<typeof subscribeBodySchema>;
    await ctx.repos.pushSubs.upsert({
      address: req.auth!.address,
      expoPushToken: body.expoPushToken,
      platform: body.platform,
    });
    res.status(201).json({ ok: true });
  });

  router.delete("/subscribe", validate({ body: unsubscribeBodySchema }), async (req, res) => {
    await ctx.repos.pushSubs.deleteToken(req.body.expoPushToken as string, req.auth!.address);
    res.json({ ok: true });
  });

  return router;
}
