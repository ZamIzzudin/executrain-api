/** @format */

// =========================================================================
// create-dev-db.js
// =========================================================================
// Memastikan database development (executrain_dev) tersedia di cluster
// Postgres lokal, lalu menjalankan migrasi Prisma.
//
// Usage:
//   npm run db:sync-dev
// =========================================================================

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const PGBIN = process.env.PGBIN || "C:/Program Files/PostgreSQL/18/bin";
const PG_PORT = process.env.PG_PORT || "5433";
const PG_USER = "postgres";
const PG_DB = "executrain_dev";
const PG_DATA = path.resolve(__dirname, "../../../scripts/pgdata");

const psql = path.join(PGBIN, "psql.exe");
const pgIsReady = path.join(PGBIN, "pg_isready.exe");

try {
  execSync(`"${pgIsReady}" -p ${PG_PORT} -q`, { stdio: "ignore" });
} catch {
  if (fs.existsSync(path.join(PG_DATA, "PG_VERSION"))) {
    console.log("Postgres belum jalan, men-start cluster lokal...");
    execSync(`"${path.join(PGBIN, "pg_ctl.exe")}" -D "${PG_DATA}" -l "${path.resolve(__dirname, "../../../scripts/pg.log")}" -w start`, {
      stdio: "inherit",
    });
  } else {
    console.error("Cluster Postgres lokal belum ada. Jalankan: node src/scripts/pg-local.js init");
    process.exit(1);
  }
}

// Buat database jika belum ada
const exists = execSync(
  `"${psql}" -p ${PG_PORT} -U ${PG_USER} -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${PG_DB}'"`,
).toString().trim();

if (exists !== "1") {
  console.log(`Membuat database ${PG_DB}...`);
  execSync(`"${psql}" -p ${PG_PORT} -U ${PG_USER} -d postgres -c "CREATE DATABASE ${PG_DB}"`, {
    stdio: "inherit",
  });
} else {
  console.log(`Database ${PG_DB} sudah ada.`);
}

console.log("Database siap.");
