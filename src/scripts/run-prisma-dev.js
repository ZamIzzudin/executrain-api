/** @format */

// =========================================================================
// run-prisma-dev.js
// =========================================================================
// Menjalankan perintah Prisma dengan NODE_ENV=development sehingga
// prisma.config.ts memakai DATABASE_URL_DEV (database dev lokal).
//
// Usage:
//   node src/scripts/run-prisma-dev.js prisma migrate dev
//   node src/scripts/run-prisma-dev.js prisma db push
//   node src/scripts/run-prisma-dev.js prisma studio
// =========================================================================

const { spawnSync } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Gunakan: node src/scripts/run-prisma-dev.js prisma <command> [options]");
  process.exit(1);
}

const bin = path.resolve(__dirname, "../../node_modules/.bin/prisma");
if (process.platform === "win32") {
  // .cmd shim di Windows
  args.unshift(bin + ".cmd");
} else {
  args.unshift(bin);
}

const r = spawnSync(args[0], args.slice(1), {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" },
  shell: process.platform === "win32",
});

process.exit(r.status ?? 1);
