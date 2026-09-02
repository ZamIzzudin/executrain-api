/**
 * Setup Article module di dev database (executrain_dev ONLY):
 *  - Tabel Article (title, category text[], content TEXT, timestamps)
 *  - Master data ARTICLE_CATEGORY (seeded default options)
 *
 * Aman dijalankan ulang (guarded + idempotent).
 */

const prisma = require("../config/prisma");
const { Client } = require("pg");

const ARTICLE_CATEGORIES = [
  { value: "INDUSTRY_INSIGHTS", label: "Industry Insights" },
  { value: "TECHNOLOGY_TRENDS", label: "Technology Trends" },
  { value: "TRAINING_TIPS", label: "Training Tips" },
  { value: "CAREER_GUIDE", label: "Career Guide" },
  { value: "COMPANY_NEWS", label: "Company News" },
];

async function guard() {
  const db = await prisma.$queryRaw`SELECT current_database() AS db`;
  if (db[0].db !== "executrain_dev") {
    console.error(`BLOCKED: current database is ${db[0].db}, bukan executrain_dev`);
    process.exit(1);
  }
}

async function main() {
  await guard();

  const dbUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  // 1. Tabel Article
  const table = await client.query(
    `SELECT to_regclass('public."Article"') AS name`,
  );
  if (!table.rows[0].name) {
    await client.query(`
      CREATE TABLE "Article" (
        id         VARCHAR(24) PRIMARY KEY,
        title      VARCHAR(255) NOT NULL,
        category   TEXT[] NOT NULL DEFAULT '{}',
        content    TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX "Article_created_at_idx" ON "Article" (created_at);
    `);
    console.log("Table Article created");
  } else {
    console.log("Table Article sudah ada");
  }

  await client.end();

  // 2. Master data ARTICLE_CATEGORY
  const existing = await prisma.masterData.count({
    where: { type: "ARTICLE_CATEGORY" },
  });
  if (existing === 0) {
    for (let i = 0; i < ARTICLE_CATEGORIES.length; i++) {
      await prisma.masterData.create({
        data: {
          type: "ARTICLE_CATEGORY",
          label: ARTICLE_CATEGORIES[i].label,
          value: ARTICLE_CATEGORIES[i].value,
          sort_order: i,
        },
      });
    }
    console.log(`ARTICLE_CATEGORY: seeded ${ARTICLE_CATEGORIES.length} options`);
  } else {
    console.log(`ARTICLE_CATEGORY: sudah ${existing} options, skip`);
  }

  console.log("Article setup selesai");
  process.exit(0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
