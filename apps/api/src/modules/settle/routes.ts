import { Router } from "express";
import { z } from "zod";
import type { RouteContext } from "../../context";
import { requireAdmin } from "../../middleware/adminKey";
import { pathParam, validate } from "../../middleware/validate";
import { ensureInvoices } from "../invoices/service";
import { settleGroup } from "./service";

const groupIdParams = z.object({
  groupId: z.string().regex(/^\d+$/, "must be a decimal group id"),
});

/**
 * Demo safety net: settle a single group right now (ignoring backoff), rebuild its
 * invoices, and view the last 50 settle_runs rows. All require the x-admin-key header.
 */
export function createAdminRoutes(ctx: RouteContext): Router {
  const router = Router();

  router.use(requireAdmin(ctx.env));

  router.post("/settle/:groupId", validate({ params: groupIdParams }), async (req, res) => {
    const groupId = BigInt(pathParam(req, "groupId"));
    const result = await settleGroup(ctx, groupId, { ignoreBackoff: true });
    res.json(result);
  });

  // Rebuild missing invoices for a settled group (settled by a member, or a failed write).
  router.post("/invoices/:groupId", validate({ params: groupIdParams }), async (req, res) => {
    const groupId = BigInt(pathParam(req, "groupId"));
    res.json(await ensureInvoices(ctx, groupId));
  });

  router.get("/settle", async (_req, res) => {
    const runs = await ctx.repos.settleRuns.listRecent(50);
    res.json({
      runs: runs.map((run) => ({
        groupId: String(run.groupId),
        status: run.status,
        txHash: run.txHash,
        attempts: run.attempts,
        nextAttemptAt: run.nextAttemptAt ? run.nextAttemptAt.toISOString() : null,
        lastError: run.lastError,
        updatedAt: run.updatedAt.toISOString(),
      })),
    });
  });

  return router;
}
