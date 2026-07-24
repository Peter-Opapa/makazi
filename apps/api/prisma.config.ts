import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` never connects to a database — it only reads this
// schema — but Prisma's own `env()` helper throws immediately if the
// variable isn't resolvable, which breaks `prisma generate` during the
// Railway build step (DATABASE_URL isn't wired up until the Postgres
// plugin is linked and only actually matters at runtime for `prisma
// migrate deploy`/the app itself). Falling back to a placeholder keeps
// `generate` working regardless of what's set at build time.
const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/db?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: DATABASE_URL,
  },
});
