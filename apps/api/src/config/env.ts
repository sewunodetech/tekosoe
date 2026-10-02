import { z } from "zod";

/**
 * Environment variables are validated with zod and fail fast: an invalid or missing
 * value stops the process before any route or scheduler is started.
 */

/** `.env` files often contain empty strings; treat them as "not set". */
const unset = (value: unknown): unknown =>
  value === undefined || value === null || value === "" ? undefined : value;

/**
 * RELAXED_ENV=true lets the server boot with placeholder values for anything
 * missing or malformed, instead of failing fast. Strict validation stays the
 * default; this switch exists only so a developer can run the app locally
 * before every variable is filled. Never enable it in production.
 */
export function isRelaxedEnv(raw: NodeJS.ProcessEnv = process.env): boolean {
  return ["1", "true", "yes", "on"].includes(String(raw["RELAXED_ENV"] ?? "").toLowerCase());
}

const RELAXED_PLACEHOLDERS: Record<string, string> = {
  MONAD_TESTNET_RPC_URL: "http://127.0.0.1:8545",
  GROUP_VAULT_ADDRESS: "0x0000000000000000000000000000000000000000",
  ENVIO_GRAPHQL_URL: "https://graphql.example.invalid/v1/tekosoe",
  DRIP_PRIVATE_KEY: `0x${"11".repeat(32)}`,
  SETTLER_PRIVATE_KEY: `0x${"22".repeat(32)}`,
  DATABASE_URL: "postgres://localhost:5432/tekosoe",
  DATABASE_URL_UNPOOLED: "postgres://localhost:5432/tekosoe",
  AUTH_DOMAIN: "localhost",
  AUTH_JWT_SECRET: "relaxed-env-dev-secret-not-for-production-use",
};

const required = () => z.preprocess(unset, z.string().min(1, "is required"));
const optionalString = (fallback = "") => z.preprocess(unset, z.string().default(fallback));
const url = () => z.preprocess(unset, z.string().url("must be a valid URL"));
const addressLike = () =>
  z.preprocess(unset, z.string().regex(/^0x[0-9a-fA-F]{40}$/, "must be a 0x-prefixed address"));
const privateKeyLike = () =>
  z.preprocess(unset, z.string().regex(/^0x[0-9a-fA-F]{64}$/, "must be a 0x-prefixed 32-byte key"));
const int = (fallback: number, min = 0) =>
  z.preprocess(unset, z.coerce.number().int().min(min).default(fallback));
const num = (fallback: number, min = 0) =>
  z.preprocess(unset, z.coerce.number().min(min).default(fallback));
const bool = (fallback: boolean) =>
  z.preprocess(
    unset,
    z
      .string()
      .default(fallback ? "true" : "false")
      .transform((value) => ["1", "true", "yes", "on"].includes(value.toLowerCase())),
  );

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: int(3000, 1),
  CORS_ORIGINS: optionalString(""),
  ADMIN_API_KEY: optionalString(""),

  // chain
  CHAIN_ID: int(10143, 1),
  MONAD_TESTNET_RPC_URL: url(),
  GROUP_VAULT_ADDRESS: addressLike(),
  AUSD_ADDRESS: optionalString(""),
  ENVIO_GRAPHQL_URL: url(),

  // backend wallets — used only to drip MON and to call settle()
  DRIP_PRIVATE_KEY: privateKeyLike(),
  SETTLER_PRIVATE_KEY: privateKeyLike(),
  LOW_BALANCE_THRESHOLD_MON: num(0.5),

  // drip
  DRIP_AMOUNT_MON: num(0),
  DRIP_MIN_BALANCE_MON: num(0),
  DRIP_RATE_LIMIT_PER_HOUR: int(5, 1),
  DRIP_DAILY_CAP: int(200, 1),
  /** A funded address can be refilled (when below DRIP_MIN_BALANCE_MON) after this many minutes. */
  DRIP_REFILL_COOLDOWN_MINUTES: int(30, 1),

  // settle scheduler
  SETTLE_INTERVAL_MS: int(30_000, 1),
  SETTLE_ALERT_ATTEMPTS: int(8, 1),

  // database
  DATABASE_URL: required(),
  DATABASE_URL_UNPOOLED: required(),

  // auth
  AUTH_DOMAIN: required(),
  AUTH_JWT_SECRET: z.preprocess(
    unset,
    z.string().min(32, "must be at least 32 characters"),
  ),
  AUTH_TOKEN_TTL_SECONDS: int(3600, 1),

  // P2 — receipts (only required when FEATURE_RECEIPTS=true)
  FEATURE_RECEIPTS: bool(false),
  S3_ENDPOINT: optionalString(""),
  S3_REGION: optionalString("us-east-1"),
  S3_BUCKET: optionalString(""),
  S3_ACCESS_KEY_ID: optionalString(""),
  S3_SECRET_ACCESS_KEY: optionalString(""),
  S3_FORCE_PATH_STYLE: bool(false),
  RECEIPT_MAX_BYTES: int(5_242_880, 1),
  RECEIPT_VERIFY_HASH: bool(true),

  // P3 — push notifications (only required when FEATURE_PUSH=true)
  FEATURE_PUSH: bool(false),
  /** Optional: only needed when "enhanced push security" is enabled for the Expo project. */
  EXPO_ACCESS_TOKEN: optionalString(""),
  ALCHEMY_WEBHOOK_SIGNING_KEY: optionalString(""),
  NOTIFY_SOURCE: z.preprocess(unset, z.enum(["alchemy", "envio"]).default("alchemy")),
});

export type Env = z.infer<typeof envSchema>;

function collectProblems(env: Env): string[] {
  const problems: string[] = [];

  if (env.DRIP_PRIVATE_KEY.toLowerCase() === env.SETTLER_PRIVATE_KEY.toLowerCase()) {
    problems.push("DRIP_PRIVATE_KEY and SETTLER_PRIVATE_KEY must be different keys");
  }

  if (env.FEATURE_RECEIPTS) {
    const missing = [
      "S3_ENDPOINT",
      "S3_BUCKET",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
    ].filter((key) => !env[key as keyof Env]);
    if (missing.length > 0) {
      problems.push(`FEATURE_RECEIPTS=true requires: ${missing.join(", ")}`);
    }
  }

  if (env.FEATURE_PUSH) {
    const missing = ["ALCHEMY_WEBHOOK_SIGNING_KEY"].filter((key) => !env[key as keyof Env]);
    if (missing.length > 0) {
      problems.push(`FEATURE_PUSH=true requires: ${missing.join(", ")}`);
    }
  }

  if (env.NOTIFY_SOURCE === "envio") {
    problems.push(
      "NOTIFY_SOURCE=envio is reserved for the optional Envio poller and is not implemented yet",
    );
  }

  return problems;
}

/** Replace every failing key with a safe placeholder (or the schema default) and re-parse. */
function relaxedParse(raw: NodeJS.ProcessEnv, error: z.ZodError): Env {
  const merged: Record<string, unknown> = { ...raw };
  const replaced: string[] = [];
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (!key) continue;
    if (key in RELAXED_PLACEHOLDERS) {
      merged[key] = RELAXED_PLACEHOLDERS[key];
    } else {
      delete merged[key]; // fall back to the schema default
    }
    replaced.push(key);
  }
  const retry = envSchema.safeParse(merged);
  if (!retry.success) {
    const details = retry.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration — ${details}`);
  }
  console.warn(`[env] RELAXED_ENV=true — placeholder used for: ${replaced.join(", ")}`);
  return retry.data;
}

/** Parse and cross-check the environment. Throws with a readable message on any problem. */
export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const relaxed = isRelaxedEnv(raw);
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    if (!relaxed) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid environment configuration — ${details}`);
    }
    const env = relaxedParse(raw, parsed.error);
    const problems = collectProblems(env);
    if (problems.length > 0) {
      console.warn(`[env] RELAXED_ENV=true — ignoring: ${problems.join("; ")}`);
    }
    return env;
  }

  const env = parsed.data;
  const problems = collectProblems(env);
  if (problems.length > 0) {
    if (!relaxed) {
      throw new Error(`Invalid environment configuration — ${problems.join("; ")}`);
    }
    console.warn(`[env] RELAXED_ENV=true — ignoring: ${problems.join("; ")}`);
  }

  return env;
}

/** CORS allowlist, parsed from the comma separated CORS_ORIGINS variable. */
export function corsOrigins(env: Env): string[] {
  return env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
