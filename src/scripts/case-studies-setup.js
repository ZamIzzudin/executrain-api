/** @format */
// =====================================================================
// CASE STUDIES SETUP (DEV ONLY — executrain_dev)
// 1. Buat tabel CaseStudy
// 2. Seed master data: CASE_CATEGORY, CASE_INDUSTRY, CASE_SOLUTION,
//    CASE_METHODOLOGY, CASE_DEPLOYMENT
// AMAN: guard current_database() = 'executrain_dev' sebelum DDL/DML.
// =====================================================================

const fs = require("fs");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const crypto = require("crypto");

const env = dotenv.parse(fs.readFileSync(".env"));
const pool = new Pool({ connectionString: env.DATABASE_URL_DEV, max: 2 });

const nanoid = () => crypto.randomBytes(12).toString("hex"); // 24 char

const SEEDS = {
  CASE_CATEGORY: [
    ["DIGITAL_TRANSFORMATION", "Digital Transformation"],
    ["CUSTOM_APPLICATION", "Custom Application"],
    ["MOBILE_APPLICATION", "Mobile Application"],
    ["SYSTEM_INTEGRATION", "System Integration"],
    ["DATA_ANALYTICS", "Data Analytics"],
  ],
  CASE_INDUSTRY: [
    ["MANUFACTURING", "Manufacturing"],
    ["HEALTHCARE", "Healthcare"],
    ["FINANCE", "Finance"],
    ["RETAIL", "Retail"],
    ["LOGISTICS", "Logistics"],
    ["EDUCATION", "Education"],
    ["GOVERNMENT", "Government"],
  ],
  CASE_SOLUTION: [
    ["CUSTOM_APP", "Custom App"],
    ["DASHBOARD", "Dashboard"],
    ["CRM", "CRM"],
    ["ERP", "ERP"],
    ["MOBILE_APP", "Mobile App"],
    ["SYSTEM_INTEGRATION", "System Integration"],
  ],
  CASE_METHODOLOGY: [
    ["AGILE_DEVELOPMENT", "Agile Development"],
  ],
  CASE_DEPLOYMENT: [
    ["ON_CLOUD", "On Cloud"],
    ["ON_PREMISE", "On Premise"],
  ],
};

(async () => {
  const db = (await pool.query("SELECT current_database() d")).rows[0].d;
  if (db !== "executrain_dev") {
    console.error("ABORT: db != executrain_dev, dapat:", db);
    process.exit(1);
  }
  console.log("DB terverifikasi:", db);

  // 1) Tabel CaseStudy
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "CaseStudy" (
      id              varchar(24)  NOT NULL,
      title           text         NOT NULL,
      category        text,
      description     text         NOT NULL,
      industries      text[]       NOT NULL DEFAULT '{}',
      solutions       text[]       NOT NULL DEFAULT '{}',
      deployment_type text,
      timeline        integer      NOT NULL DEFAULT 0,
      compliance      text,
      methodology     text,
      team_size       jsonb        NOT NULL DEFAULT '[]'::jsonb,
      testimonial     jsonb        NOT NULL DEFAULT '{"testimoni":"","name":"","company":""}'::jsonb,
      link            text,
      updated_at      timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at      timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CaseStudy_pkey" PRIMARY KEY (id)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "CaseStudy_created_at_idx"
      ON "CaseStudy" (created_at);
  `);
  console.log("Tabel CaseStudy siap");

  // 2) Seed master data
  for (const [type, rows] of Object.entries(SEEDS)) {
    let inserted = 0;
    for (const [value, label] of rows) {
      const exists = await pool.query(
        'SELECT id FROM "MasterData" WHERE type = $1 AND value = $2',
        [type, value],
      );
      if (exists.rows.length === 0) {
        const order = rows.map((r) => r[0]).indexOf(value);
        await pool.query(
          'INSERT INTO "MasterData" (id, type, label, value, sort_order) VALUES ($1,$2,$3,$4,$5)',
          [nanoid(), type, label, value, order],
        );
        inserted++;
      }
    }
    console.log(`Seed ${type}: ${inserted} baru, sisanya sudah ada`);
  }

  await pool.end();
  console.log("Selesai.");
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});