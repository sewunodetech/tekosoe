import type { NextFunction, Request, RequestHandler, Response } from "express";
import { jwtVerify } from "jose";
import type { Env } from "../config/env";
import type { ChainService } from "../chain/groupVault";
import { normalizeAddress } from "../lib/address";
import { errors } from "../lib/errors";

const NEGATIVE_TTL_MS = 15_000;

/** Verifies the bearer token issued by POST /api/auth/verify and fills req.auth. */
export function requireAuth(env: Env): RequestHandler {
  const secret = new TextEncoder().encode(env.AUTH_JWT_SECRET);

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.get("authorization") ?? "";
      const [scheme, token] = header.split(" ");
      if (scheme !== "Bearer" || !token) {
        throw errors.unauthorized("MISSING_TOKEN", "Missing bearer token");
      }

      let payload;
      try {
        ({ payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] }));
      } catch {
        throw errors.unauthorized("INVALID_TOKEN", "Token is invalid or expired");
      }

      if (typeof payload.sub !== "string") {
        throw errors.unauthorized("INVALID_TOKEN", "Token is invalid or expired");
      }

      req.auth = { address: normalizeAddress(payload.sub) };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export interface MembershipChecker {
  isMember(address: string, groupId: bigint): Promise<boolean>;
  middleware(paramName?: string): RequestHandler;
}

/**
 * Membership is read from the contract — never from Envio — so a member who joined
 * seconds ago is not rejected while the indexer catches up. Member lists are cached
 * in memory for 15 seconds; a miss triggers an on-chain re-check.
 */
export function createMembershipChecker(deps: { chain: ChainService }): MembershipChecker {
  const snapshots = new Map<string, { members: Set<string>; at: number }>();
  const negatives = new Map<string, number>();

  async function isMember(address: string, groupId: bigint): Promise<boolean> {
    const groupKey = groupId.toString();
    const pairKey = `${groupKey}:${address}`;
    const snapshot = snapshots.get(groupKey);

    // Membership only ever grows, so a hit in any snapshot is always valid.
    if (snapshot?.members.has(address)) return true;

    const negativeExpiry = negatives.get(pairKey);
    if (negativeExpiry !== undefined && negativeExpiry > Date.now()) return false;

    const members = await deps.chain.membersOf(groupId);
    const set = new Set(members.map((member) => member.toLowerCase()));
    snapshots.set(groupKey, { members: set, at: Date.now() });

    const member = set.has(address);
    if (!member) negatives.set(pairKey, Date.now() + NEGATIVE_TTL_MS);
    return member;
  }

  function middleware(paramName = "groupId"): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const raw = req.params[paramName];
        if (typeof raw !== "string" || !/^\d+$/.test(raw)) throw errors.invalidGroupId();
        if (!req.auth) throw errors.unauthorized();

        const member = await isMember(req.auth.address, BigInt(raw));
        if (!member) {
          throw errors.forbidden("NOT_GROUP_MEMBER", "You are not a member of this group");
        }

        req.groupId = raw;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  return { isMember, middleware };
}
