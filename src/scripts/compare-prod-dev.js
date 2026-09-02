/** @format */
// =====================================================================
// READ-ONLY: cek nilai enum & contoh data prod vs dev
// HANYA SELECT. Tidak ada write.
// =====================================================================

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

const envProd = dotenv.parse(
  fs.readFileSync("D:/projects/executrain/api/.env"),
);
const PROD_URL = envProd.DATABASE_URL;
const DEV_URL = envProd.DATABASE_URL_DEV;

async function getEnums(pool) {
  const { rows } = await pool.query(
    `SELECT t.typname, e.enumlabel
       FROM pg_type t
       JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname IN ('SkillLevel','Language','FreeTrialCategory','ProductCategory','SkillAcceleratorLevel','SkillAcceleratorLanguage','SkillAcceleratorCategory','CourseLevel','CourseLanguage','CourseCategory')
      ORDER BY t.typname, e.enumsortorder`,
  );
  return rows;
}

async function sample(pool, table, cols) {
  const sel = cols.map((c) => `"${c}"`).join(", ");
  try {
    const { rows } = await pool.query(
      `SELECT ${sel} FROM "public"."${table}" ORDER BY "created_at" DESC LIMIT 3`,
    );
    return rows;
  } catch (e) {
    return [{ error: e.message }];
  }
}

(async () => {
  const poolProd = new Pool({ connectionString: PROD_URL, max: 1 });
  const poolDev = new Pool({ connectionString: DEV_URL, max: 1 });

  console.log("=== ENUM di PROD ===");
  const prodEnums = await getEnums(poolProd);
  const grouped = {};
  for (const r of prodEnums) {
    (grouped[r.typname] = grouped[r.typname] || []).push(r.enumlabel);
  }
  for (const [k, v] of Object.entries(grouped)) {
    console.log(`  ${k}: ${v.join(" | ")}`);
  }

  console.log("\n=== ENUM di DEV ===");
  const devEnums = await getEnums(poolDev);
  const dgrouped = {};
  for (const r of devEnums) {
    (dgrouped[r.typname] = dgrouped[r.typname] || []).push(r.enumlabel);
  }
  for (const [k, v] of Object.entries(dgrouped)) {
    console.log(`  ${k}: ${v.join(" | ")}`);
  }

  console.log("\n=== SAMPLE PROD FreeTrialProduct (produk_category, skill_level, language, duration) ===");
  const ft = await sample(poolProd, "FreeTrialProduct", [
    "product_name",
    "product_category",
    "skill_level",
    "language",
    "duration",
    "benefits",
  ]);
  console.log(JSON.stringify(ft, null, 1).slice(0, 2000));

  console.log("\n=== SAMPLE PROD Product (produk_category, skill_level, language, duration) ===");
  const pr = await sample(poolProd, "Product", [
    "product_name",
    "product_category",
    "skill_level",
    "language",
    "duration",
    "benefits",
  ]);
  console.log(JSON.stringify(pr, null, 1).slice(0, 2000));

  // distinct product_category counts prod
  console.log("\n=== distinct product_category (PROD FreeTrialProduct) ===");
  const c1 = await poolProd.query(`SELECT "product_category", COUNT(*) FROM "public"."FreeTrialProduct" GROUP BY 1 ORDER BY 2 DESC`);
  console.log(JSON.stringify(c1.rows));
  console.log("=== distinct product_category (PROD Product) ===");
  const c2 = await poolProd.query(`SELECT "product_category", COUNT(*) FROM "public"."Product" GROUP BY 1 ORDER BY 2 DESC`);
  console.log(JSON.stringify(c2.rows));

  await poolProd.end();
  await poolDev.end();
  console.log("\nSelesai (read-only).");
})();