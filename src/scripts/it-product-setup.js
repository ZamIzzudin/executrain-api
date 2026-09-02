/** @format */
// =====================================================================
// IT PRODUCT SETUP (DEV ONLY — executrain_dev)
// 1. Buat tabel ITProduct
// 2. Seed master data TECH_STACK
// AMAN: guard current_database() = 'executrain_dev' sebelum DDL/DML.
// =====================================================================

const fs = require("fs");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const crypto = require("crypto");

const env = dotenv.parse(fs.readFileSync(".env"));
const pool = new Pool({ connectionString: env.DATABASE_URL_DEV, max: 2 });

const nanoid = () => crypto.randomBytes(12).toString("hex"); // 24 char

const TECH_STACK_SEED = [
  // value, label
  ["REACT", "React"],
  ["NODEJS", "Node.js"],
  ["TYPESCRIPT", "TypeScript"],
  ["PYTHON", "Python"],
  ["JAVA", "Java"],
  ["KOTLIN", "Kotlin"],
  ["SWIFT", "Swift"],
  ["FLUTTER", "Flutter"],
  ["MYSQL", "MySQL"],
  ["POSTGRESQL", "PostgreSQL"],
  ["MONGODB", "MongoDB"],
  ["DOCKER", "Docker"],
  ["KUBERNETES", "Kubernetes"],
];

(async () => {
  const db = (await pool.query("SELECT current_database() d")).rows[0].d;
  if (db !== "executrain_dev") {
    console.error("ABORT: db != executrain_dev, dapat:", db);
    process.exit(1);
  }
  console.log("DB terverifikasi:", db);

  // 1) Tabel ITProduct
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "ITProduct" (
      id          varchar(24)  NOT NULL,
      title       text         NOT NULL,
      description text         NOT NULL,
      banner      jsonb        NOT NULL DEFAULT '{"url":"","public_id":""}'::jsonb,
      tech_stack  text[]       NOT NULL DEFAULT '{}',
      link        text,
      problem     text,
      feature     text[]       NOT NULL DEFAULT '{}',
      compliance  text,
      highlight   jsonb        NOT NULL DEFAULT '[]'::jsonb,
      updated_at  timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at  timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ITProduct_pkey" PRIMARY KEY (id)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "ITProduct_created_at_idx"
      ON "ITProduct" (created_at);
  `);
  console.log("Tabel ITProduct siap");

  // 2) seed TECH_STACK
  let inserted = 0;
  for (const [value, label] of TECH_STACK_SEED) {
    const exists = await pool.query(
      'SELECT id FROM "MasterData" WHERE type = $1 AND value = $2',
      ["TECH_STACK", value],
    );
    if (exists.rows.length === 0) {
      const order = TECH_STACK_SEED.map((s) => s[0]).indexOf(value);
      await pool.query(
        'INSERT INTO "MasterData" (id, type, label, value, sort_order) VALUES ($1,$2,$3,$4,$5)',
        [nanoid(), "TECH_STACK", label, value, order],
      );
      inserted++;
    }
  }
  console.log(`Seed TECH_STACK: ${inserted} baru, sisanya sudah ada`);

  await pool.end();
  console.log("Selesai.");
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});