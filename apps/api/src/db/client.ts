import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

/**
 * Pooled connection used by the running app (DATABASE_URL).
 *
 * Serverless Postgres (Neon's pooler) closes idle connections on its own. pg then emits
 * `error` on the pool for that idle client; without a listener Node treats it as an
 * unhandled 'error' event and the whole process crashes. The pool already discards the
 * broken client and opens a new one on the next query, so logging is all that is needed.
 */
export function createPool(
  connectionString: string,
  onIdleError: (error: Error) => void = () => undefined,
): pg.Pool {
  const pool = new pg.Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
  pool.on("error", onIdleError);
  return pool;
}

export function createDb(pool: pg.Pool): Db {
  return drizzle({ client: pool, schema });
}

/** Cheap connectivity probe used by /api/status. */
export async function pingDb(pool: pg.Pool): Promise<number> {
  const started = Date.now();
  await pool.query("select 1");
  return Date.now() - started;
}
