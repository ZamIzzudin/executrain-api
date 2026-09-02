/** @format */
// =====================================================================
// APP DEVELOPMENT SETUP (DEV ONLY — executrain_dev)
// 1. Buat tabel AppDevelopment
// 2. Seed master data APP_TECH_STACK (terpisah dari TECH_STACK IT Product)
// 3. Seed master data APP_METHODOLOGY (Agile Development)
// AMAN: guard current_database() = 'executrain_dev' sebelum DDL/DML.
// =====================================================================

const fs = require("fs");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const crypto = require("crypto");

const env = dotenv.parse(fs.readFileSync(".env"));
const pool = new Pool({ connectionString: env.DATABASE_URL_DEV, max: 2 });

const nanoid = () => crypto.randomBytes(12).toString("hex"); // 24 char

const APP_TECH_STACK_SEED = [
  // value, label
  ["REACT", "React"],
  ["REACT_NATIVE", "React Native"],
  ["NODEJS", "Node.js"],
  ["TYPESCRIPT", "TypeScript"],
  ["NEXTJS", "Next.js"],
  ["FLUTTER", "Flutter"],
  ["KOTLIN", "Kotlin"],
  ["SWIFT", "Swift"],
  ["LARAVEL", "Laravel"],
  ["GO", "Go"],
  ["MYSQL", "MySQL"],
  ["POSTGRESQL", "PostgreSQL"],
  ["MONGODB", "MongoDB"],
];

const APP_METHODOLOGY_SEED = [
  // value, label
  ["AGILE_DEVELOPMENT", "Agile Development"],
];

(async () => {
  const db = (await pool.query("SELECT current_database() d")).rows[0].d;
  if (db !== "executrain_dev") {
    console.error("ABORT: db != executrain_dev, dapat:", db);
    process.exit(1);
  }
  console.log("DB terverifikasi:", db);

  // 1) Tabel AppDevelopment
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "AppDevelopment" (
      id          varchar(24)  NOT NULL,
      title       text         NOT NULL,
      tech_stack  text[]       NOT NULL DEFAULT '{}',
      description text         NOT NULL,
      challenge   text,
      team_size   jsonb        NOT NULL DEFAULT '[]'::jsonb,
      timeline    integer      NOT NULL DEFAULT 0,
      methodology text,
      compliance  text,
      highlights  jsonb        NOT NULL DEFAULT '[]'::jsonb,
      updated_at  timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at  timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AppDevelopment_pkey" PRIMARY KEY (id)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "AppDevelopment_created_at_idx"
      ON "AppDevelopment" (created_at);
  `);
  console.log("Tabel AppDevelopment siap");

  // 2) seed APP_TECH_STACK
  let inserted = 0;
  for (const [value, label] of APP_TECH_STACK_SEED) {
    const exists = await pool.query(
      'SELECT id FROM "MasterData" WHERE type = $1 AND value = $2',
      ["APP_TECH_STACK", value],
    );
    if (exists.rows.length === 0) {
      const order = APP_TECH_STACK_SEED.map((s) => s[0]).indexOf(value);
      await pool.query(
        'INSERT INTO "MasterData" (id, type, label, value, sort_order) VALUES ($1,$2,$3,$4,$5)',
        [nanoid(), "APP_TECH_STACK", label, value, order],
      );
      inserted++;
    }
  }
  console.log(`Seed APP_TECH_STACK: ${inserted} baru, sisanya sudah ada`);

  // 3) seed APP_METHODOLOGY
  inserted = 0;
  for (const [value, label] of APP_METHODOLOGY_SEED) {
    const exists = await pool.query(
      'SELECT id FROM "MasterData" WHERE type = $1 AND value = $2',
      ["APP_METHODOLOGY", value],
    );
    if (exists.rows.length === 0) {
      await pool.query(
        'INSERT INTO "MasterData" (id, type, label, value, sort_order) VALUES ($1,$2,$3,$4,$5)',
        [nanoid(), "APP_METHODOLOGY", label, value, 0],
      );
      inserted++;
    }
  }
  console.log(`Seed APP_METHODOLOGY: ${inserted} baru, sisanya sudah ada`);

  await pool.end();
  console.log("Selesai.");
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});