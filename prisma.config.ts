import path from "node:path";
import { config } from "dotenv";
config();
import { defineConfig } from "prisma/config";

const isDev = process.env.NODE_ENV === "development";
const dbUrl =
  isDev && process.env.DATABASE_URL_DEV
    ? process.env.DATABASE_URL_DEV
    : process.env.DATABASE_URL;

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: { path: path.join("prisma", "migrations") },
  datasource: { url: dbUrl },
  migrate: {
    adapter: async () => {
      const { Pool } = await import("pg");
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const pool = new Pool({ connectionString: dbUrl });
      return new PrismaPg(pool);
    },
  },
});
