import { Router } from "express";
import { z } from "zod";
import type { RouteContext } from "../../context";
import { ADDRESS_PATTERN, checksumAddress, normalizeAddress } from "../../lib/address";
import { errors } from "../../lib/errors";
import { parseOrThrow, validate } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { apiRateLimit, HOUR_MS } from "../../middleware/rateLimit";
import type { ProfileRow } from "../../db/repos";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const URL_LIKE = /(https?:\/\/|:\/\/|data:)/i;

const displayNameSchema = z
  .string()
  .max(200)
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, "display name cannot be empty")
      .max(40, "display name must be at most 40 characters")
      .refine((value) => !CONTROL_CHARS.test(value), "display name contains control characters"),
  );

const citySchema = z
  .string()
  .max(200)
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .max(60, "city must be at most 60 characters")
      .refine((value) => !CONTROL_CHARS.test(value), "city contains control characters"),
  );

const avatarColorSchema = z
  .string()
  .max(32)
  .refine((value) => !URL_LIKE.test(value), "avatarColor must be a color or a preset key");

/** Mirrors profileSchema in @tekosoe/shared; countryCode is ISO 3166-1 alpha-2. */
const updateBodySchema = z.object({
  displayName: displayNameSchema,
  countryCode: z
    .string()
    .regex(/^[A-Za-z]{2}$/, "countryCode must be a 2-letter ISO code")
    .transform((value) => value.toUpperCase()),
  city: citySchema.optional(),
  avatarColor: avatarColorSchema.optional(),
});

const addressesParamSchema = z.string().transform((value, ctx) => {
  const list = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (list.length === 0) {
    ctx.addIssue({ code: "custom", message: "addresses query parameter is required" });
    return z.NEVER;
  }
  if (list.length > 20) {
    ctx.addIssue({ code: "custom", message: "at most 20 addresses per request" });
    return z.NEVER;
  }
  for (const item of list) {
    if (!ADDRESS_PATTERN.test(item)) {
      ctx.addIssue({ code: "custom", message: `not a valid address: ${item}` });
      return z.NEVER;
    }
  }
  return list.map((item) => item.toLowerCase());
});

function serialize(profile: ProfileRow) {
  return {
    address: checksumAddress(profile.address),
    displayName: profile.displayName,
    city: profile.city,
    countryCode: profile.countryCode,
    avatarColor: profile.avatarColor,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

/**
 * Profiles are optional and public by design: the invite screen shows the inviter's
 * name before the visitor joins (see README — display names are public).
 */
export function createProfileRoutes(ctx: RouteContext): Router {
  const router = Router();

  router.put("/me", requireAuth(ctx.env), validate({ body: updateBodySchema }), async (req, res) => {
    const body = req.body as z.infer<typeof updateBodySchema>;
    const profile = await ctx.repos.profiles.upsert({
      address: req.auth!.address,
      displayName: body.displayName,
      countryCode: body.countryCode,
      city: body.city || null,
      avatarColor: body.avatarColor ?? null,
    });
    res.json(serialize(profile));
  });

  router.get("/me", requireAuth(ctx.env), async (req, res) => {
    const profile = await ctx.repos.profiles.get(req.auth!.address);
    if (!profile) {
      throw errors.notFound("PROFILE_NOT_FOUND", "This account has no profile yet");
    }
    res.json(serialize(profile));
  });

  router.get(
    "/",
    apiRateLimit({
      windowMs: HOUR_MS,
      max: 120,
      code: "RATE_LIMITED",
      message: "Too many requests, try again later",
    }),
    async (req, res) => {
      const raw = typeof req.query.addresses === "string" ? req.query.addresses : "";
      const addresses = parseOrThrow(addressesParamSchema, raw);
      const unique = [...new Set(addresses.map((address) => normalizeAddress(address)))];
      const rows = await ctx.repos.profiles.list(unique);
      res.json({
        profiles: rows
          .map((row) => ({
            address: checksumAddress(row.address),
            displayName: row.displayName,
            city: row.city,
            countryCode: row.countryCode,
            avatarColor: row.avatarColor,
          }))
          // Only addresses that actually have a profile are returned.
          .sort((a, b) => a.address.localeCompare(b.address)),
      });
    },
  );

  return router;
}
