/** @format */
// =====================================================================
// MASTER DATA SETUP (DEV ONLY — executrain_dev)
// 1. Buat tabel MasterData
// 2. Ubah Course.category & SkillAccelerator.category: enum -> text
// 3. Drop enum CourseCategory & SkillAcceleratorCategory (tidak dipakai lagi)
// 4. Seed default: SKILL_CATEGORY, COURSE_CATEGORY, COURSE_FRAMEWORK
// AMAN: guard current_database() = 'executrain_dev' sebelum DDL/DML.
// =====================================================================

const fs = require("fs");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const crypto = require("crypto");

const env = dotenv.parse(fs.readFileSync(".env"));
const pool = new Pool({ connectionString: env.DATABASE_URL_DEV, max: 2 });

const nanoid = () => crypto.randomBytes(12).toString("hex"); // 24 char

const DEFAULT_SEED = [
  // type, value, label
  ["SKILL_CATEGORY", "DATA_ANALYTICS", "Data Analytics"],
  ["SKILL_CATEGORY", "AUTOMATION", "Automation"],
  ["SKILL_CATEGORY", "CYBERSECURITY", "Cybersecurity"],
  ["SKILL_CATEGORY", "PROJECT_MANAGEMENT", "Project Management"],
  ["SKILL_CATEGORY", "LEADERSHIP", "Leadership"],
  ["SKILL_CATEGORY", "EMOTIONAL_INTELLIGENCE", "Emotional Intelligence"],
];

(async () => {
  const db = (await pool.query("SELECT current_database() d")).rows[0].d;
  if (db !== "executrain_dev") {
    console.error("ABORT: db != executrain_dev, dapat:", db);
    process.exit(1);
  }
  console.log("DB terverifikasi:", db);

  // 1) Tabel MasterData
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "MasterData" (
      id         varchar(24)  NOT NULL,
      type       text         NOT NULL,
      label      text         NOT NULL,
      value      text         NOT NULL,
      sort_order integer      NOT NULL DEFAULT 0,
      created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MasterData_pkey" PRIMARY KEY (id)
    );
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "MasterData_type_value_key"
      ON "MasterData" (type, value);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "MasterData_type_sort_order_idx"
      ON "MasterData" (type, sort_order);
  `);
  // Kolom scope (grup tambahan, mis. FRAMEWORK_ITEM pakai scope = ai/data/auto/...)
  await pool.query(`
    ALTER TABLE "MasterData"
      ADD COLUMN IF NOT EXISTS scope text;
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "MasterData_type_scope_sort_order_idx"
      ON "MasterData" (type, scope, sort_order);
  `);
  console.log("Tabel MasterData siap");

  // 2) enum -> text
  await pool.query('ALTER TABLE "Course" ALTER COLUMN category TYPE text;');
  console.log("Course.category -> text");
  await pool.query('ALTER TABLE "SkillAccelerator" ALTER COLUMN category TYPE text;');
  console.log("SkillAccelerator.category -> text");

  // 3) drop enum (sudah tidak dipakai kolom mana pun)
  await pool.query('DROP TYPE IF EXISTS "CourseCategory";');
  await pool.query('DROP TYPE IF EXISTS "SkillAcceleratorCategory";');
  console.log("Enum CourseCategory & SkillAcceleratorCategory di-drop");

  // 4) seed default
  let inserted = 0;
  for (const [type, value, label] of DEFAULT_SEED) {
    const exists = await pool.query(
      'SELECT id FROM "MasterData" WHERE type = $1 AND value = $2',
      [type, value],
    );
    if (exists.rows.length === 0) {
      const order = DEFAULT_SEED.filter((s) => s[0] === type).indexOf([
        type,
        value,
        label,
      ]);
      await pool.query(
        'INSERT INTO "MasterData" (id, type, label, value, sort_order) VALUES ($1,$2,$3,$4,$5)',
        [nanoid(), type, label, value, order],
      );
      inserted++;
    }
  }
  console.log(`Seed default: ${inserted} baru, sisanya sudah ada`);

  await pool.end();
  console.log("Selesai.");
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
