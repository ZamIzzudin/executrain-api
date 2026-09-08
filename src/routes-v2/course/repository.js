/** @format */

// =========================================================================
// Course Repository (PostgreSQL / Prisma)
// =========================================================================

const prisma = require("../../config/prisma");

const CourseRepository = {
  count() {
    return prisma.course.count();
  },

  findById(id) {
    return prisma.course.findUnique({
      where: { id },
    });
  },

  search(query) {
    return prisma.course.findMany({
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
    return prisma.course.findMany({
      orderBy: { created_at: "desc" },
    });
  },

  /**
   * Public paginated list dengan filter category & search.
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async publicList({ page = 1, limit = 9, category, search, framework_type }) {
    const take = Math.max(1, parseInt(limit, 10));
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * take;

    const where = {};
    if (category) where.category = category;
    if (framework_type) where.framework_type = framework_type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
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
   * - categories: item FRAMEWORK_ITEM (nilai category course) disertai scope/peg framework.
   * - framework_types: scope yang dipakai pada FRAMEWORK_ITEM (framework course = scope).
   * @returns {Promise<{categories: Array, skill_levels: string[], languages: string[], framework_types: Array}>}
   */
  async filters() {
    const [frameworkItems, skill_levels, languages] = await Promise.all([
      prisma.masterData.findMany({
        where: { type: "FRAMEWORK_ITEM" },
        orderBy: [{ scope: "asc" }, { sort_order: "asc" }],
        select: { value: true, label: true, scope: true },
      }),
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'CourseLevel' ORDER BY e.enumsortorder`,
      prisma.$queryRaw`SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'CourseLanguage' ORDER BY e.enumsortorder`,
    ]);

    // Framework = scope unik dari FRAMEWORK_ITEM.
    const scopeSet = new Set();
    for (const it of frameworkItems) {
      if (it.scope) scopeSet.add(it.scope);
    }
    const frameworks = Array.from(scopeSet).map((s) => ({
      value: s,
      label: s,
    }));

    return {
      categories: frameworkItems.map((r) => ({
        value: r.value,
        label: r.label || r.value,
        scope: r.scope || undefined,
      })),
      skill_levels: skill_levels.map((r) => r.enumlabel),
      languages: languages.map((r) => r.enumlabel),
      framework_types: frameworks,
    };
  },

  create(data) {
    return prisma.course.create({
      data,
    });
  },

  update(id, data) {
    return prisma.course.update({
      where: { id },
      data,
    });
  },

  remove(id) {
    return prisma.course.delete({ where: { id } });
  },
};

module.exports = CourseRepository;