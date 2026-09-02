/** @format */

// =========================================================================
// Skill Accelerator Repository (PostgreSQL / Prisma)
// =========================================================================

const prisma = require("../../config/prisma");

const SkillAcceleratorRepository = {
  count() {
    return prisma.skillAccelerator.count();
  },

  findById(id) {
    return prisma.skillAccelerator.findUnique({
      where: { id },
    });
  },

  search(query) {
    return prisma.skillAccelerator.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { created_at: "desc" },
    });
  },

  findAll() {
    return prisma.skillAccelerator.findMany({
      orderBy: { created_at: "desc" },
    });
  },

  /**
   * Public paginated list dengan filter category & search.
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async publicList({ page = 1, limit = 9, category, search }) {
    const take = Math.max(1, parseInt(limit, 10));
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * take;

    const where = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.skillAccelerator.count({ where }),
      prisma.skillAccelerator.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take,
      }),
    ]);

    const total_pages = Math.max(1, Math.ceil(total / take));

    return {
      data: items,
      pagination: {
        current_page: Math.max(1, parseInt(page, 10)),
        total_pages,
        total_products: total,
        per_page: take,
        has_next: Math.max(1, parseInt(page, 10)) < total_pages,
        has_prev: Math.max(1, parseInt(page, 10)) > 1,
      },
    };
  },

  /**
   * Daftar opsi filter (dari master data & enum di database) untuk dropdown publik.
   * @returns {Promise<{categories: Array<{value:string,label:string}>, skill_levels: string[], languages: string[]}>}
   */
  async filters() {
    const [categories, skill_levels, languages] = await Promise.all([
      prisma.masterData.findMany({
        where: { type: "SKILL_CATEGORY" },
        orderBy: { sort_order: "asc" },
        select: { value: true, label: true },
      }),
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'SkillAcceleratorLevel' ORDER BY e.enumsortorder`,
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'SkillAcceleratorLanguage' ORDER BY e.enumsortorder`,
    ]);

    return {
      categories: categories.map((r) => ({
        value: r.value,
        label: r.label,
      })),
      skill_levels: skill_levels.map((r) => r.enumlabel),
      languages: languages.map((r) => r.enumlabel),
    };
  },

  create(data) {
    return prisma.skillAccelerator.create({
      data,
    });
  },

  update(id, data) {
    return prisma.skillAccelerator.update({
      where: { id },
      data,
    });
  },

  remove(id) {
    return prisma.skillAccelerator.delete({ where: { id } });
  },
};

module.exports = SkillAcceleratorRepository;
