/** Migrasi data: pindahkan home-page.framework.items -> MasterData FRAMEWORK_ITEM (Opsi B).
 *
 * Cara pakai (sekali jalan di env target):
 *   node src/scripts/migrate-framework-to-master-data.js
 *
 * Yang dilakukan:
 *   - Baca PageContent code=home-page, ambil content.framework.items
 *   - Untuk tiap scope & item: insert MasterData type=FRAMEWORK_ITEM
 *     (label=value=nama item, scope=id scope, sort_order=urutan)
 *   - Hapus key `framework` dari content page (sumber pindah ke master data)
 */
const prisma = require("../config/prisma");

(async () => {
  const db = await prisma.$queryRaw`SELECT current_database() AS db`;
  const dbName = db[0]?.db || "unknown";
  console.log("Target DB:", dbName);

  const page = await prisma.pageContent.findUnique({
    where: { code: "home-page" },
    select: { id: true, content: true },
  });
  if (!page) {
    console.log("home-page tidak ditemukan — selesai");
    return;
  }
  const items = page.content?.framework?.items || {};
  const scopes = Object.keys(items);
  if (scopes.length === 0) {
    console.log("framework.items kosong — tidak ada migrasi");
    return;
  }

  let inserted = 0;
  let skipped = 0;
  for (const scope of scopes) {
    const list = items[scope] || [];
    for (let i = 0; i < list.length; i++) {
      const label = String(list[i]).trim();
      if (!label) continue;
      const existing = await prisma.masterData.findFirst({
        where: { type: "FRAMEWORK_ITEM", value: label },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.masterData.create({
        data: {
          type: "FRAMEWORK_ITEM",
          label,
          value: label,
          scope,
          sort_order: i,
        },
      });
      inserted++;
    }
  }

  // Kosongkan framework dari PageContent (sumber data pindah ke master data)
  const content = page.content || {};
  if (content.framework) {
    delete content.framework;
    await prisma.pageContent.update({
      where: { id: page.id },
      data: { content },
    });
  }

  const total = await prisma.masterData.count({
    where: { type: "FRAMEWORK_ITEM" },
  });
  console.log(`inserted=${inserted} skipped=${skipped}`);
  console.log("total FRAMEWORK_ITEM:", total);
})().catch((e) => console.error("ERR", e.message)).finally(() => setTimeout(() => process.exit(0), 500));