import { defineConfig } from "drizzle-kit";

// Migrations run with DATABASE_URL_UNPOOLED (direct connection), never the pooled app URL.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env["DATABASE_URL_UNPOOLED"] ?? "",
  },
});
