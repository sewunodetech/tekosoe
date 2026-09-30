import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

/** Pooled connection used by the running app (DATABASE_URL). */
export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
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
