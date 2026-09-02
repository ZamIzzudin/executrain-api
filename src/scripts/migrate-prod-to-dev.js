/** @format */
// =====================================================================
// MIGRASI DATA: PROD -> DEV (read-only dari prod, write HANYA ke dev)
//
//  - FreeTrialProduct (prod, db "postgres") -> SkillAccelerator (dev, db "executrain_dev")
//      mapping: product_name->title, product_description->description,
//               max_participant->student, benefits->feature,
//               language INGGRIS->ENGLISH, skill_level utuh (BEGINNER/INTERMEDIATE ok)
//  - Product (prod) -> Course (dev)
//      mapping: product_name->title, product_description->description,
//               max_participant->student, benefits->feature,
//               category IT_TRAINING (enum baru), framework_type default 'Training',
//               language INDONESIA->INDONESIA, skill_level BEGINNER ok
//
// AMAN: script ini hanya SELECT dari prod. INSERT dilakukan ke devCustomer database
//       yang DIVERIFIKASI bernama executrain_dev. Tidak menyentuh prod.
//   Guard: sebelum INSERT, cek current_database() == executrain_dev.
// =====================================================================

const fs = require("fs");
const dotenv = require("dotenv");
const { Pool } = require("pg");

const env1 = dotenv.parse(fs.readFileSync("D:/projects/executrain/api/.env")); // v1 (prod + dev creds)

const PROD_URL = env1.DATABASE_URL; // db postgres (prod)
const DEV_URL = env1.DATABASE_URL_DEV; // db executrain_dev (dev)

const langMap = { INGGRIS: "ENGLISH", INDONESIA: "INDONESIA" };

function bannerOf(b) {
  if (b && b.url) return { url: b.url, public_id: b.public_id ?? "" };
  return { url: "", public_id: "" };
}

(async () => {
  const prod = new Pool({ connectionString: PROD_URL, max: 2 });
  const dev = new Pool({ connectionString: DEV_URL, max: 2 });

  // Guard dev db
  const devDb = (await dev.query("SELECT current_database() d")).rows[0].d;
  if (devDb !== "executrain_dev") {
    console.error("ABORT: dev db != executrain_dev, dapat:", devDb);
    process.exit(1);
  }
  console.log("DB dev diverifikasi:", devDb);

  // ============ 1) SkillAccelerator dari FreeTrialProduct ============
  const ftRows = (await prod.query('SELECT * FROM "public"."FreeTrialProduct"')).rows;
  let saNew = 0;
  for (const r of ftRows) {
    const existing = await dev.query('SELECT id FROM "SkillAccelerator" WHERE id = $1', [r.id]);
    if (existing.rows.length > 0) continue;
    await dev.query(
      `INSERT INTO "SkillAccelerator"
        (id, title, banner, category, description, student, duration, skill_level, language, feature, created_at, updated_at)
       VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        r.id,
        r.product_name,
        JSON.stringify(bannerOf(r.banner)),
        r.product_category, // DATA_ANALYTICS/AUTOMATION/dst, cocok enum dev
        r.product_description,
        r.max_participant ?? 0,
        r.duration ?? 0,
        r.skill_level, // BEGINNER/INTERMEDIATE, ada di enum dev
        langMap[r.language] ?? "ENGLISH",
        r.benefits ?? [],
        r.created_at ?? new Date(),
        r.updated_at ?? r.created_at ?? new Date(),
      ],
    );
    saNew++;
  }
  console.log(`SkillAccelerator: dimigrasi ${saNew} dari ${ftRows.length} (skip jika id sudah ada)`);

  // ============ 2) Course dari Product ============
  const pRows = (await prod.query('SELECT * FROM "public"."Product"')).rows;
  let coNew = 0;
  for (const r of pRows) {
    const existing = await dev.query('SELECT id FROM "Course" WHERE id = $1', [r.id]);
    if (existing.rows.length > 0) continue;
    await dev.query(
      `INSERT INTO "Course"
        (id, title, banner, category, description, student, duration, skill_level, language, framework_type, feature, created_at, updated_at)
       VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        r.id,
        r.product_name,
        JSON.stringify(bannerOf(r.banner)),
        r.product_category, // IT_TRAINING -> enum dev sekarang punya IT_TRAINING
        r.product_description,
        r.max_participant ?? 0,
        r.duration ?? 0,
        r.skill_level, // BEGINNER, ada di enum dev
        langMap[r.language] ?? "INDONESIA",
        "Training", // framework_type default saat ini
        r.benefits ?? [],
        r.created_at ?? new Date(),
        r.updated_at ?? r.created_at ?? new Date(),
      ],
    );
    coNew++;
  }
  console.log(`Course: dimigrasi ${coNew} dari ${pRows.length} (skip jika id sudah ada)`);

  await prod.end();
  await dev.end();

  console.log("\nSelesai. Untuk verifikasi, jalankan query secara terpisah.");
})();