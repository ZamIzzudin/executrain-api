/**
 * Setup RBAC di dev database (executrain_dev ONLY):
 *  - Tables: Role, Menu, RoleMenu
 *  - User: tambah kolom role_id (FK ke Role), backfill dari kolom enum lama `role`,
 *          lalu set NOT NULL.
 *  - Seed: Role SUPERADMIN & ADMIN (is_system=true), daftar Menu CMS.
 *
 * AMAN dijalankan ulang (idempotent + guarded ke executrain_dev).
 * Jalankan: node src/scripts/rbac-setup.js
 */

const prisma = require("../config/prisma");
const { Client } = require("pg");

const ROLES = [
  {
    name: "SUPERADMIN",
    description: "Full access — mengelola semua modul & user",
    is_system: true,
  },
  {
    name: "ADMIN",
    description: "Admin CMS — akses menu sesuai permission",
    is_system: true,
  },
];

// Daftar menu CMS. parent_code menunjuk code menu induk (untuk submenu).
// Semua role baru wajib memiliki minimal menu 'home'.
const MENUS = [
  { code: "home", label: "Home", path: "/", icon: "home", parent_code: null, sort_order: 1 },
  { code: "access", label: "Access", path: null, icon: "key", parent_code: null, sort_order: 2 },
  { code: "users", label: "Users", path: "/users", icon: "users", parent_code: "access", sort_order: 1 },
  { code: "roles", label: "Role Management", path: "/roles", icon: "shield", parent_code: "access", sort_order: 2 },
  { code: "catalog", label: "Catalog", path: null, icon: "layout", parent_code: null, sort_order: 3 },
  { code: "skill-accelerator", label: "Skill Accelerator", path: "/skill-accelerator", icon: "book", parent_code: "catalog", sort_order: 1 },
  { code: "course", label: "Course", path: "/course", icon: "graduation", parent_code: "catalog", sort_order: 2 },
  { code: "schedule", label: "Schedule", path: "/schedule", icon: "calendar", parent_code: "catalog", sort_order: 3 },
  { code: "learning-path", label: "Learning Path", path: "/learning-path", icon: "map", parent_code: "catalog", sort_order: 4 },
  { code: "tech-solution", label: "Tech Solution", path: null, icon: "boxes", parent_code: null, sort_order: 4 },
  { code: "it-product", label: "IT Product", path: "/it-product", icon: "cpu", parent_code: "tech-solution", sort_order: 1 },
  { code: "app-development", label: "App Development", path: "/app-development", icon: "appwindow", parent_code: "tech-solution", sort_order: 2 },
  { code: "insight", label: "Insight", path: null, icon: "newspaper", parent_code: null, sort_order: 5 },
  { code: "case-studies", label: "Case Studies", path: "/case-studies", icon: "folder", parent_code: "insight", sort_order: 1 },
  { code: "article", label: "Article", path: "/article", icon: "file", parent_code: "insight", sort_order: 2 },
  { code: "content", label: "Content", path: "/content", icon: "settings", parent_code: null, sort_order: 6 },
  { code: "master-data", label: "Master Data", path: "/master-data", icon: "database", parent_code: null, sort_order: 7 },
  { code: "pages", label: "Pages", path: "/pages", icon: "file-stack", parent_code: null, sort_order: 8 },
  { code: "about", label: "About", path: "/about", icon: "info", parent_code: "pages", sort_order: 1 },
  { code: "skill-accelerator-page", label: "Skill Accelerator", path: "/skill-accelerator-page", icon: "zap", parent_code: "pages", sort_order: 2 },
  { code: "course-catalog-page", label: "Course Catalog", path: "/course-catalog-page", icon: "graduation-cap", parent_code: "pages", sort_order: 3 },
  { code: "schedule-page", label: "Schedule", path: "/schedule-page", icon: "calendar-days", parent_code: "pages", sort_order: 12 },
  { code: "tech-advisory-page", label: "Tech Advisory", path: "/tech-advisory-page", icon: "compass", parent_code: "pages", sort_order: 4 },
  { code: "talent-placement-page", label: "IT Talent Placement", path: "/talent-placement-page", icon: "users-round", parent_code: "pages", sort_order: 5 },
  { code: "implementation-support-page", label: "Implementation & Support", path: "/implementation-support-page", icon: "life-buoy", parent_code: "pages", sort_order: 6 },
  { code: "ready-to-use-it-product", label: "Ready-to-use IT Products", path: "/ready-to-use-it-product", icon: "package", parent_code: "pages", sort_order: 7 },
  { code: "custom-app-development", label: "Custom App Development", path: "/custom-app-development", icon: "app-window", parent_code: "pages", sort_order: 8 },
  { code: "technology-cloud-licensing", label: "Technology & Cloud Licensing", path: "/technology-cloud-licensing", icon: "cloud", parent_code: "pages", sort_order: 9 },
  { code: "case-study-page", label: "Case Study Page", path: "/case-study-page", icon: "folder-search", parent_code: "pages", sort_order: 10 },
  { code: "article-page", label: "Article Page", path: "/article-page", icon: "newspaper", parent_code: "pages", sort_order: 11 },
  { code: "home-page", label: "Home Page", path: "/home-page", icon: "home", parent_code: "pages", sort_order: 0 },
];

async function guard() {
  const db = await prisma.$queryRaw`SELECT current_database() AS db`;
  if (db[0].db !== "executrain_dev") {
    console.error(`BLOCKED: current database is ${db[0].db}, bukan executrain_dev`);
    process.exit(1);
  }
}

function nanoid(len = 24) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function main() {
  await guard();

  const dbUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    // 0. Hindari bentrok nama: enum lama "Role" (dari kolom User.role) di-rename
    //    jadi "UserRole". Kolom role masih memakainya sampai schema di-update.
    const roleType = await client.query(
      `SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
       WHERE t.typname='Role' AND n.nspname='public' AND t.typtype='e'`,
    );
    if (roleType.rows.length > 0) {
      await client.query(`ALTER TYPE "Role" RENAME TO "UserRole"`);
      console.log('Enum "Role" di-rename ke "UserRole" (utk hindari bentrok tabel)');
    }

    // 1. Tabel Role
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Role" (
        id VARCHAR(24) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_system BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "Role_name_key" UNIQUE (name)
      )
    `);

    // 2. Tabel Menu
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Menu" (
        id VARCHAR(24) PRIMARY KEY,
        code VARCHAR(100) NOT NULL,
        label VARCHAR(150) NOT NULL,
        path TEXT,
        icon VARCHAR(100),
        parent_code VARCHAR(100),
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "Menu_code_key" UNIQUE (code)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "Menu_parent_code_idx" ON "Menu"(parent_code)`);
    await client.query(`CREATE INDEX IF NOT EXISTS "Menu_sort_order_idx" ON "Menu"(sort_order)`);

    // 3. Tabel RoleMenu (composite PK)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "RoleMenu" (
        role_id VARCHAR(24) NOT NULL,
        menu_id VARCHAR(24) NOT NULL,
        CONSTRAINT "RoleMenu_pkey" PRIMARY KEY (role_id, menu_id),
        CONSTRAINT "RoleMenu_role_id_fkey" FOREIGN KEY (role_id) REFERENCES "Role"(id) ON DELETE CASCADE,
        CONSTRAINT "RoleMenu_menu_id_fkey" FOREIGN KEY (menu_id) REFERENCES "Menu"(id) ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "RoleMenu_menu_id_idx" ON "RoleMenu"(menu_id)`);

    // 4. User: tambah kolom role_id (nullable dulu utk backfill)
    const hasRoleId = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='role_id'`,
    );
    if (hasRoleId.rows.length === 0) {
      await client.query(`ALTER TABLE "User" ADD COLUMN role_id VARCHAR(24)`);
      console.log("Kolom User.role_id ditambahkan");
    }

    // 5. Seed Role SUPERADMIN/ADMIN
    const roleIds = {};
    for (const r of ROLES) {
      const existing = await client.query(`SELECT id FROM "Role" WHERE name = $1`, [r.name]);
      if (existing.rows.length === 0) {
        const id = nanoid();
        await client.query(
          `INSERT INTO "Role"(id, name, description, is_system, is_active) VALUES ($1,$2,$3,$4,true)`,
          [id, r.name, r.description, r.is_system],
        );
        roleIds[r.name] = id;
        console.log(`Role ${r.name} dibuat`);
      } else {
        roleIds[r.name] = existing.rows[0].id;
        console.log(`Role ${r.name} sudah ada`);
      }
    }

    // 6. Seed Menu (upsert by code, id dijaga stabil)
    const menuIds = {};
    for (const m of MENUS) {
      const existing = await client.query(`SELECT id FROM "Menu" WHERE code = $1`, [m.code]);
      if (existing.rows.length === 0) {
        const id = nanoid();
        await client.query(
          `INSERT INTO "Menu"(id, code, label, path, icon, parent_code, sort_order, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
          [id, m.code, m.label, m.path, m.icon, m.parent_code, m.sort_order],
        );
        menuIds[m.code] = id;
        console.log(`Menu ${m.code} dibuat`);
      } else {
        menuIds[m.code] = existing.rows[0].id;
        // update label/path/icon/parent utk jaga konsistensi dgn kode terbaru
        await client.query(
          `UPDATE "Menu" SET label=$1, path=$2, icon=$3, parent_code=$4, sort_order=$5, updated_at=now()
           WHERE code=$6`,
          [m.label, m.path, m.icon, m.parent_code, m.sort_order, m.code],
        );
      }
    }

    // 7. Backfill user.role_id dari kolom enum lama `role` (hanya bila kolom masih ada)
    const hasRoleCol = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='role'`,
    );
    if (hasRoleCol.rows.length > 0) {
      const users = await client.query(`SELECT id, role FROM "User" WHERE role_id IS NULL`);
      for (const u of users.rows) {
        const roleName = u.role === "SUPERADMIN" ? "SUPERADMIN" : "ADMIN";
        const rid = roleIds[roleName];
        if (rid) {
          await client.query(`UPDATE "User" SET role_id = $1 WHERE id = $2`, [rid, u.id]);
          console.log(`User ${u.id} (${u.role}) -> role_id ${rid}`);
        }
      }
    } else {
      console.log("Kolom User.role lama tidak ada — skip backfill");
    }

    // 8. role_id NOT NULL + FK
    await client.query(`
      ALTER TABLE "User" ALTER COLUMN role_id SET NOT NULL
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='User_role_id_fkey') THEN
          ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey"
            FOREIGN KEY (role_id) REFERENCES "Role"(id);
        END IF;
      END $$;
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "User_role_id_idx" ON "User"(role_id)`);

    // 9. Default permission: SUPERADMIN -> semua menu, ADMIN -> home (+ menu umum)
    const allMenus = Object.values(menuIds);
    for (const [roleName, roleId] of Object.entries(roleIds)) {
      if (roleName === "SUPERADMIN") {
        for (const menuId of allMenus) {
          await client.query(
            `INSERT INTO "RoleMenu"(role_id, menu_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [roleId, menuId],
          );
        }
      } else {
        // ADMIN: beri akses menu yang sama seperti menu CMS saat ini utk role ADMIN lama
        const adminMenus = ["home", "catalog", "skill-accelerator", "course", "schedule", "learning-path", "tech-solution",
          "it-product", "app-development", "insight", "case-studies", "article",
          "content", "master-data", "pages", "about", "skill-accelerator-page", "course-catalog-page", "tech-advisory-page", "talent-placement-page", "implementation-support-page", "ready-to-use-it-product", "custom-app-development", "technology-cloud-licensing", "case-study-page", "article-page", "home-page"];
        for (const code of adminMenus) {
          const menuId = menuIds[code];
          if (menuId) {
            await client.query(
              `INSERT INTO "RoleMenu"(role_id, menu_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
              [roleId, menuId],
            );
          }
        }
      }
    }

    // 10. Seed konten halaman statis (PageContent) utk compro.
    const defaultPages = [
      { code: "about", title: "About Us", content: {} },
      { code: "skill-accelerator", title: "Skill Accelerator", content: {} },
      { code: "course-catalog", title: "Course Catalog", content: {} },
      { code: "tech-advisory", title: "Tech Advisory", content: {} },
      { code: "talent-placement", title: "IT Talent Placement", content: {} },
      { code: "implementation-support", title: "Implementation & Support", content: {} },
      { code: "ready-to-use-it-product", title: "Ready-to-use IT Products", content: {} },
      { code: "custom-app-development", title: "Custom App Development", content: {} },
      { code: "technology-cloud-licensing", title: "Technology & Cloud Licensing", content: {} },
      { code: "case-study-page", title: "Case Study Page", content: {} },
      { code: "article-page", title: "Article Page", content: {} },
      { code: "home-page", title: "Home Page", content: {} },
    ];
    for (const p of defaultPages) {
      const existingPage = await client.query(
        `SELECT id FROM "PageContent" WHERE code = $1`,
        [p.code],
      );
      if (existingPage.rows.length === 0) {
        await client.query(
          `INSERT INTO "PageContent"(id, code, title, content, is_active) VALUES ($1,$2,$3,$4,true)`,
          [nanoid(), p.code, p.title, JSON.stringify(p.content)],
        );
        console.log(`PageContent ${p.code} dibuat`);
      }
    }

    console.log("RBAC setup selesai.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
