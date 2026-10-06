import { randomBytes } from "node:crypto";
import { getAddress, verifyMessage, type Address, type Hex } from "viem";
import { createSiweMessage } from "viem/siwe";
import { SignJWT } from "jose";
import type { RouteContext } from "../../context";
import { errors } from "../../lib/errors";

/** Challenge lifetime: single use, five minutes. */
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;

/**
 * SIWE (EIP-4361) message built with viem/siwe. issuedAt is always derived from
 * expiresAt so the exact same bytes can be rebuilt at verification time without
 * storing the message itself.
 */
function buildMessage(
  ctx: RouteContext,
  params: { address: string; nonce: string; issuedAt: Date; expiresAt: Date },
): string {
  return createSiweMessage({
    domain: ctx.env.AUTH_DOMAIN,
    address: getAddress(params.address) as Address,
    uri: `https://${ctx.env.AUTH_DOMAIN}`,
    version: "1",
    chainId: ctx.env.CHAIN_ID,
    nonce: params.nonce,
    issuedAt: params.issuedAt,
    expirationTime: params.expiresAt,
    statement: "Sign in to Tekosue.",
  });
}

export async function createChallenge(
  ctx: RouteContext,
  address: string,
): Promise<{ message: string; nonce: string; expiresAt: string }> {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + CHALLENGE_TTL_MS);
  const nonce = randomBytes(16).toString("hex");

  await ctx.repos.authNonces.create({
    nonce,
    address: address.toLowerCase(),
    expiresAt,
  });

  const message = buildMessage(ctx, { address, nonce, issuedAt, expiresAt });
  return { message, nonce, expiresAt: expiresAt.toISOString() };
}

export async function verifyChallenge(
  ctx: RouteContext,
  params: { address: string; signature: string },
): Promise<{ token: string; expiresAt: string }> {
  const address = params.address.toLowerCase();
  const row = await ctx.repos.authNonces.getLatestValid(address, new Date());
  if (!row) throw errors.challengeNotFound();

  const message = buildMessage(ctx, {
    address,
    nonce: row.nonce,
    issuedAt: new Date(row.expiresAt.getTime() - CHALLENGE_TTL_MS),
    expiresAt: row.expiresAt,
  });

  let valid = false;
  try {
    valid = await verifyMessage({
      address: address as Address,
      message,
      signature: params.signature as Hex,
    });
  } catch {
    valid = false;
  }
  if (!valid) throw errors.invalidSignature();

  // Conditional update: a replay of the same challenge loses the race and is rejected.
  const consumed = await ctx.repos.authNonces.markUsed(row.nonce, new Date());
  if (!consumed) throw errors.challengeNotFound();

  const secret = new TextEncoder().encode(ctx.env.AUTH_JWT_SECRET);
  const ttl = ctx.env.AUTH_TOKEN_TTL_SECONDS;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(address)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secret);

  return { token, expiresAt: new Date(Date.now() + ttl * 1000).toISOString() };
}

/** Hourly cleanup of expired nonces — one of the intervals stopped on shutdown. */
export function startNonceCleanup(ctx: RouteContext, intervalMs = 60 * 60 * 1000): { stop(): void } {
  const timer = setInterval(() => {
    void ctx.repos.authNonces
      .deleteExpired(new Date())
      .catch((error: unknown) => ctx.logger.warn({ err: error }, "nonce cleanup failed"));
  }, intervalMs);
  return { stop: () => clearInterval(timer) };
}
