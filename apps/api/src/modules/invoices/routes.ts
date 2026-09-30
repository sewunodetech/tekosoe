import { Router } from "express";
import { z } from "zod";
import type { RouteContext } from "../../context";
import { errors } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";
import { apiRateLimit, HOUR_MS } from "../../middleware/rateLimit";
import { parseOrThrow, pathParam, validate } from "../../middleware/validate";
import { createShareToken, serializeInvoice, verifyShareToken } from "./service";

const numberParams = z.object({
  number: z.string().regex(/^INV-\d+-\d{3,}$/, "must be an invoice number"),
});
const tokenQuery = z.string().min(1, "token query parameter is required").max(1024);

/** /api/groups/:groupId/invoices/me — my invoice plus a share token for the QR / web link. */
export function createGroupInvoiceRoutes(ctx: RouteContext): Router {
  const router = Router();

  router.get(
    "/:groupId/invoices/me",
    requireAuth(ctx.env),
    ctx.membership.middleware(),
    async (req, res) => {
      const row = await ctx.repos.invoices.get(Number(req.groupId), req.auth!.address);
      if (!row) {
        throw errors.notFound("INVOICE_NOT_FOUND", "Your invoice is not ready yet");
      }
      res.json({ ...serializeInvoice(row), shareToken: await createShareToken(ctx, row.number) });
    },
  );

  return router;
}

/**
 * /api/invoices/:number?token=… — read by the web verification page. It recomputes
 * invoiceHash from the chain; this endpoint only hands over the stored payload.
 */
export function createInvoiceRoutes(ctx: RouteContext): Router {
  const router = Router();

  router.get(
    "/:number",
    apiRateLimit({
      windowMs: HOUR_MS,
      max: 120,
      code: "RATE_LIMITED",
      message: "Too many requests, try again later",
    }),
    validate({ params: numberParams }),
    async (req, res) => {
      const number = pathParam(req, "number");
      const token = parseOrThrow(tokenQuery, typeof req.query.token === "string" ? req.query.token : "");
      if (!(await verifyShareToken(ctx, number, token))) {
        throw errors.unauthorized("INVALID_SHARE_TOKEN", "This invoice link is invalid or expired");
      }
      const row = await ctx.repos.invoices.getByNumber(number);
      if (!row) throw errors.notFound("INVOICE_NOT_FOUND", "Invoice not found");
      res.json(serializeInvoice(row));
    },
  );

  return router;
}
