/**
 * Setup Content Management tables di dev database (executrain_dev ONLY):
 *  - Enum: AssetCategory, AssetType, JobType, ExperienceLevel, JobStatus,
 *          ApplicationStatus
 *  - Tables: Asset, Career, CareerApplicant, CareerGallery, Gallery,
 *            Partner, Socmed, Statistic, Testimonial
 *  - Seed default assets (6 kategori utama) + socmed defaults jika kosong
 *
 * Aman dijalankan ulang (guarded + idempotent).
 */

const prisma = require("../config/prisma");
const { Client } = require("pg");

const ENUMS = [
  ["AssetCategory", ["hero_background","hero_video","about_image","statistic_background","steps_background","services_image","cta_schedule_image","contact_image","framework_banner","hero_blog","hero_career","hero_contact","hero_free_trial","hero_product","hero_schedule","hero_service"]],
  ["AssetType", ["image","video"]],
  ["JobType", ["FULL_TIME","PART_TIME","CONTRACT","INTERNSHIP","FREELANCE"]],
  ["ExperienceLevel", ["ENTRY","MID","SENIOR","LEAD","EXECUTIVE"]],
  ["JobStatus", ["DRAFT","PUBLISHED","CLOSED","ARCHIVED"]],
  ["ApplicationStatus", ["PENDING","UNDER_REVIEW","SHORTLISTED","INTERVIEW","REJECTED","HIRED"]],
];

const S3_BASE = "https://storagewebsitetoj.blob.core.windows.net/image";

// Default asset list (sama dengan v1)
const ASSET_CATEGORIES = [
  { category: "hero_background", name: "Hero Background", default_url: `${S3_BASE}/assets/ddxseg9njypotvqwkgdb.jpg`, type: "image" },
  { category: "hero_video", name: "Hero Video", default_url: `${S3_BASE}/assets/zc9eubwjugf9txmswlf1.jpg`, type: "video" },
  { category: "steps_background", name: "Steps Background", default_url: `${S3_BASE}/assets/zc9eubwjugf9txmswlf1.jpg`, type: "image" },
  { category: "services_image", name: "Services Section Image", default_url: `${S3_BASE}/assets/mh7juzlomjra8xwvtvj5.jpg`, type: "image" },
  { category: "cta_schedule_image", name: "CTA Schedule Image", default_url: `${S3_BASE}/assets/qhq8pmgzq7tffe5dxaf0.png`, type: "image" },
  { category: "contact_image", name: "Contact Section Image", default_url: `${S3_BASE}/assets/vqnqkagin0k5ws0rxrvl.jpg`, type: "image" },
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

  // 1. Enums
  for (const [name, values] of ENUMS) {
    const exists = await client.query(`SELECT to_regtype('"' || $1 || '"') AS t`, [name]);
    if (!exists.rows[0].t) {
      await client.query(
        `CREATE TYPE "${name}" AS ENUM (${values.map((v) => `'${v}'`).join(", ")})`,
      );
      console.log(`Enum ${name} created`);
    } else {
      console.log(`Enum ${name} sudah ada`);
    }
  }

  // 2. Tables
  const tables = [
    {
      name: "Asset",
      sql: `CREATE TABLE IF NOT EXISTS "Asset" (
        id VARCHAR(24) PRIMARY KEY,
        category "AssetCategory" NOT NULL,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        public_id TEXT NOT NULL DEFAULT '',
        fallback_url TEXT NOT NULL DEFAULT '',
        fallback_public_id TEXT NOT NULL DEFAULT '',
        type "AssetType" NOT NULL DEFAULT 'image',
        is_active BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "Asset_category_key" UNIQUE (category)
      );`,
    },
    {
      name: "Career",
      sql: `CREATE TABLE IF NOT EXISTS "Career" (
        id VARCHAR(24) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT[] NOT NULL DEFAULT '{}',
        requirements TEXT[] NOT NULL DEFAULT '{}',
        experiance_requirement TEXT[] NOT NULL DEFAULT '{}',
        applicant_question TEXT[] NOT NULL DEFAULT '{}',
        location VARCHAR(255) NOT NULL DEFAULT '',
        department VARCHAR(255) NOT NULL DEFAULT '',
        job_type "JobType" NOT NULL DEFAULT 'FULL_TIME',
        experience_level "ExperienceLevel" NOT NULL DEFAULT 'MID',
        vacancies INTEGER NOT NULL DEFAULT 1,
        contact_email VARCHAR(255) NOT NULL DEFAULT '',
        deadline TIMESTAMPTZ,
        status "JobStatus" NOT NULL DEFAULT 'DRAFT',
        applicants_count INTEGER NOT NULL DEFAULT 0,
        views INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "Career_slug_key" UNIQUE (slug)
      );
      CREATE INDEX IF NOT EXISTS "Career_status_idx" ON "Career" (status);
      CREATE INDEX IF NOT EXISTS "Career_department_idx" ON "Career" (department);
      CREATE INDEX IF NOT EXISTS "Career_location_idx" ON "Career" (location);`,
    },
    {
      name: "CareerApplicant",
      sql: `CREATE TABLE IF NOT EXISTS "CareerApplicant" (
        id VARCHAR(24) PRIMARY KEY,
        career_id VARCHAR(24) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255) NOT NULL,
        cover_letter TEXT,
        resume JSONB NOT NULL DEFAULT '{}'::jsonb,
        portfolio_url TEXT,
        linkedin_url TEXT,
        github_url TEXT,
        experience_years INTEGER NOT NULL DEFAULT 0,
        current_position VARCHAR(255),
        current_company VARCHAR(255),
        availability_date TIMESTAMPTZ,
        status "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
        notes TEXT,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CareerApplicant_career_id_fkey" FOREIGN KEY (career_id) REFERENCES "Career"(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "CareerApplicant_career_id_idx" ON "CareerApplicant" (career_id);
      CREATE INDEX IF NOT EXISTS "CareerApplicant_email_idx" ON "CareerApplicant" (email);
      CREATE INDEX IF NOT EXISTS "CareerApplicant_status_idx" ON "CareerApplicant" (status);`,
    },
    {
      name: "CareerGallery",
      sql: `CREATE TABLE IF NOT EXISTS "CareerGallery" (
        id VARCHAR(24) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        image JSONB NOT NULL DEFAULT '{"public_id":"","url":""}'::jsonb,
        "order" INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "CareerGallery_order_idx" ON "CareerGallery" ("order");
      CREATE INDEX IF NOT EXISTS "CareerGallery_is_active_idx" ON "CareerGallery" (is_active);`,
    },
    {
      name: "Gallery",
      sql: `CREATE TABLE IF NOT EXISTS "Gallery" (
        id VARCHAR(24) PRIMARY KEY,
        title VARCHAR(255) NOT NULL DEFAULT '',
        image JSONB NOT NULL DEFAULT '{"public_id":"","url":""}'::jsonb,
        "order" INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "Gallery_order_idx" ON "Gallery" ("order");
      CREATE INDEX IF NOT EXISTS "Gallery_is_active_idx" ON "Gallery" (is_active);`,
    },
    {
      name: "Partner",
      sql: `CREATE TABLE IF NOT EXISTS "Partner" (
        id VARCHAR(24) PRIMARY KEY,
        partner_name VARCHAR(255),
        logo JSONB NOT NULL DEFAULT '{"public_id":"","url":""}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );`,
    },
    {
      name: "Socmed",
      sql: `CREATE TABLE IF NOT EXISTS "Socmed" (
        id VARCHAR(24) PRIMARY KEY,
        socmed_name VARCHAR(255),
        socmed_link TEXT,
        logo JSONB NOT NULL DEFAULT '{"public_id":"","url":""}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );`,
    },
    {
      name: "Statistic",
      sql: `CREATE TABLE IF NOT EXISTS "Statistic" (
        id VARCHAR(24) PRIMARY KEY,
        year_experience INTEGER,
        total_participant INTEGER,
        total_topic_class INTEGER,
        total_training_completed INTEGER,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );`,
    },
    {
      name: "Testimonial",
      sql: `CREATE TABLE IF NOT EXISTS "Testimonial" (
        id VARCHAR(24) PRIMARY KEY,
        person_name VARCHAR(255),
        person_title VARCHAR(255),
        testimonial TEXT,
        photo JSONB NOT NULL DEFAULT '{"public_id":"","url":""}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );`,
    },
  ];

  for (const t of tables) {
    await client.query(t.sql);
    console.log(`Table ${t.name} ready`);
  }

  await client.end();

  // 3. Seed default assets (hanya jika tabel Asset kosong)
  const assetCount = await prisma.asset.count();
  if (assetCount === 0) {
    await prisma.asset.createMany({
      data: ASSET_CATEGORIES.map((c) => ({
        category: c.category,
        name: c.name,
        url: c.default_url,
        fallback_url: c.default_url,
        type: c.type,
        is_active: true,
      })),
    });
    console.log(`Asset: seeded ${ASSET_CATEGORIES.length} default assets`);
  } else {
    console.log(`Asset: sudah ${assetCount} rows, skip seed`);
  }

  // 4. (Opsional) — Socmed tidak di-seed default; data diambil dari migrasi prod.

  console.log("Content management setup selesai");
  process.exit(0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
