/** Migrasi default course legacy ke framework+category Learning Path (sekali jalan).
 *
 * Latar belakang: sebelum modul Learning Path, course disimpan dengan
 * framework_type='Training' & category='IT_TRAINING' (nilai master data lama
 * COURSE_CATEGORY/COURSE_FRAMEWORK yang sudah dihapus). Field framework_type
 * sekarang menampung scope FRAMEWORK_ITEM (ai/data/auto/...), dan category
 * menampung value FRAMEWORK_ITEM di scope tsb.
 *
 * Skrip ini menetapkan SATU nilai (framework+category) default utk semua course
 * yang masih memakai nilai legacy, agar course lama tetap punya kombinasi valid.
 * Tim admin akan membenahi/memetakan ulang via CMS.
 *
 * Default: framework = 'data', category = 'Excel Data Management'.
 *
 * Cara pakai:
 *   node src/scripts/migrate-course-learning-path.js
 */
const prisma = require("../config/prisma");

const VALID_SCOPES = [
  "ai",
  "data",
  "auto",
  "cyber",
  "governance",
  "service",
  "pm",
  "ea",
  "core",
];

const DEFAULT_FRAMEWORK = "data";
const DEFAULT_CATEGORY = "Excel Data Management";

(async () => {
  const db = await prisma.$queryRaw`SELECT current_database() AS db`;
  const dbName = db[0]?.db || "unknown";
  if (dbName !== "executrain_dev") {
    console.error("ABORT: db != executrain_dev, dapat:", dbName);
    process.exit(1);
  }
  console.log("Target DB:", dbName);

  // Pastikan target category valid (FRAMEWORK_ITEM di scope data).
  const target = await prisma.masterData.findFirst({
    where: {
      type: "FRAMEWORK_ITEM",
      value: DEFAULT_CATEGORY,
      scope: DEFAULT_FRAMEWORK,
    },
  });
  console.log(
    "Target kategori:",
    target ? `${DEFAULT_FRAMEWORK}/${DEFAULT_CATEGORY}` : "TIDAK DITEMUKAN",
  );

  const courses = await prisma.course.findMany({
    select: { id: true, title: true, framework_type: true, category: true },
  });

  let updated = 0;
  for (const c of courses) {
    const fwOk = VALID_SCOPES.includes(c.framework_type);
    // category dianggap valid bila bukan legacy IT_TRAINING dan tidak kosong.
    const catOk =
      Boolean(c.category) && c.category !== "IT_TRAINING";
    if (fwOk && catOk) continue;

    const data = {};
    if (!VALID_SCOPES.includes(c.framework_type)) {
      data.framework_type = DEFAULT_FRAMEWORK;
    }
    if (!c.category || c.category === "IT_TRAINING") {
      // Category legacy IT_TRAINING dianggap belum valid → default.
      data.category = DEFAULT_CATEGORY;
    }

    await prisma.course.update({ where: { id: c.id }, data });
    updated++;
    console.log(
      `- ${c.title.slice(0, 40)} | ${c.framework_type}/${c.category} -> ${data.framework_type || c.framework_type}/${data.category || c.category}`,
    );
  }

  console.log(`Selesai. Course diubah: ${updated}/${courses.length}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});