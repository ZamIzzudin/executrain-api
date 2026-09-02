/**
 * Migrasi data Content Management dari PROD (db postgres) → DEV (executrain_dev).
 * READ-ONLY dari prod; INSERT hanya ke executrain_dev (guard).
 * Tabel: Asset, Career, CareerApplicant, CareerGallery, Gallery, Partner,
 *        Socmed, Statistic, Testimonial.
 * Idempotent: hanya insert row yang id-nya belum ada di dev.
 */

const { Client } = require("pg");

const PROD_URL =
  "postgresql://postgres:qyw6zbvmx7jtr49m@43.157.228.111:9080/postgres";
const DEV_URL =
  process.env.DATABASE_URL_DEV ||
  "postgresql://postgres:qyw6zbvmx7jtr49m@43.157.228.111:9080/executrain_dev";

const TABLES = [
  "Asset",
  "Career",
  "CareerApplicant",
  "CareerGallery",
  "Gallery",
  "Partner",
  "Socmed",
  "Statistic",
  "Testimonial",
];

async function main() {
  const dev = new Client({ connectionString: DEV_URL });
  await dev.connect();

  const db = await dev.query("SELECT current_database() AS db");
  if (db.rows[0].db !== "executrain_dev") {
    console.error(`BLOCKED: dev db is ${db.rows[0].db}`);
    process.exit(1);
  }

  const prod = new Client({ connectionString: PROD_URL });
  await prod.connect();

  for (const table of TABLES) {
    console.log(`--- ${table} ---`);
    // Ambil kolom aktual dari prod (hindari asumsi schema)
    const prodCols = await prod.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [table],
    );
    const colNames = prodCols.rows.map((r) => r.column_name);

    // CareerApplicant tidak punya created_at (pakai applied_at)
    const orderCol = table === "CareerApplicant" ? "applied_at" : "created_at";
    const prodRows = await prod.query(
      `SELECT * FROM "${table}" ORDER BY "${orderCol}" ASC`,
    );
    if (prodRows.rows.length === 0) {
      console.log(`${table}: prod kosong, skip`);
      continue;
    }

    // Ambil id yang sudah ada di dev
    const existing = await dev.query(
      `SELECT id FROM "${table}" WHERE id = ANY($1)`,
      [prodRows.rows.map((r) => r.id)],
    );
    const existingIds = new Set(existing.rows.map((r) => r.id));

    // Asset: unique by category — cek juga kategori yang sudah ada di dev
    // (default seed bisa punya kategori sama tapi id beda)
    let skipByKey = new Set();
    if (table === "Asset") {
      const devAssets = await dev.query(`SELECT category FROM "Asset"`);
      const devCats = new Set(devAssets.rows.map((r) => r.category));
      skipByKey = new Set(
        prodRows.rows.filter((r) => devCats.has(r.category)).map((r) => r.id),
      );
    }

    const toInsert = prodRows.rows.filter(
      (r) => !existingIds.has(r.id) && !skipByKey.has(r.id),
    );
    if (toInsert.length === 0) {
      console.log(`${table}: semua ${prodRows.rows.length} rows sudah ada di dev`);
      continue;
    }

    const cols = colNames;
    const colList = cols.map((c) => `"${c}"`).join(", ");
    for (const row of toInsert) {
      const values = cols.map((c) => {
        const v = row[c];
        if (v === null) return "NULL";
        if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
        if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
        if (v instanceof Date) return `'${v.toISOString()}'`;
        if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
        return String(v);
      });
      const sql = `INSERT INTO "${table}" (${colList}) VALUES (${values.join(", ")})`;
      try {
        await dev.query(sql);
      } catch (e) {
        console.error(`  [${table}] GAGAL insert ${row.id}: ${e.message}`);
      }
    }
    console.log(`${table}: inserted ${toInsert.length} rows (total prod ${prodRows.rows.length})`);
  }

  await prod.end();
  await dev.end();
  console.log("Migrasi content management selesai");
  process.exit(0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
