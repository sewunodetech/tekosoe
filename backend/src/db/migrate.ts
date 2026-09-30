import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

/**
 * Migrations run as a pre-deploy command (`npm run db:migrate`), never automatically
 * on app start. They use the direct (unpooled) connection string.
 *
 * Deliberately does NOT run the full `loadEnv()` check: applying schema must not
 * require chain keys, RPC urls or auth secrets — only a database URL.
 */
const directUrl =
  process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"] ?? "";

if (!directUrl) {
  console.error(
    "Missing DATABASE_URL_UNPOOLED (or DATABASE_URL). Set it in .env or the environment.",
  );
  process.exit(1);
}
if (!process.env["DATABASE_URL_UNPOOLED"]) {
  console.warn("DATABASE_URL_UNPOOLED not set — falling back to DATABASE_URL.");
}

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../drizzle",
);

const pool = new pg.Pool({ connectionString: directUrl, max: 1 });

try {
  const db = drizzle({ client: pool });
  await migrate(db, { migrationsFolder });
  process.stdout.write(`Migrations applied from ${migrationsFolder}\n`);
} finally {
  await pool.end();
}
