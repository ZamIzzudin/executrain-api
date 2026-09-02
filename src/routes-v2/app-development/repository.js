/** @format */

// =========================================================================
// AppDevelopment Repository (PostgreSQL / Prisma)
// =========================================================================

const prisma = require("../../config/prisma");

const AppDevelopmentRepository = {
  count() {
    return prisma.appDevelopment.count();
  },

  findById(id) {
    return prisma.appDevelopment.findUnique({
      where: { id },
    });
  },

  search(query) {
    return prisma.appDevelopment.findMany({
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
    return prisma.appDevelopment.findMany({
      orderBy: { created_at: "desc" },
    });
  },

  /**
   * Public paginated list dengan filter tech_stack & search.
   */
  async publicList({ page = 1, limit = 9, tech_stack, search }) {
    const take = Math.max(1, parseInt(limit, 10));
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * take;

    const where = {};
    if (tech_stack) where.tech_stack = { has: tech_stack };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.appDevelopment.count({ where }),
      prisma.appDevelopment.findMany({
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
   * Opsi filter publik: tech stack dari master data APP_TECH_STACK,
   * methodology dari master data APP_METHODOLOGY.
   */
  async filters() {
    const [tech_stacks, methodologies] = await Promise.all([
      prisma.masterData.findMany({
        where: { type: "APP_TECH_STACK" },
        orderBy: { sort_order: "asc" },
        select: { value: true, label: true },
      }),
      prisma.masterData.findMany({
        where: { type: "APP_METHODOLOGY" },
        orderBy: { sort_order: "asc" },
        select: { value: true, label: true },
      }),
    ]);

    return {
      tech_stacks: tech_stacks.map((r) => ({
        value: r.value,
        label: r.label,
      })),
      methodologies: methodologies.map((r) => ({
        value: r.value,
        label: r.label,
      })),
    };
  },

  create(data) {
    return prisma.appDevelopment.create({
      data,
    });
  },

  update(id, data) {
    return prisma.appDevelopment.update({
      where: { id },
      data,
    });
  },

  remove(id) {
    return prisma.appDevelopment.delete({ where: { id } });
  },
};

module.exports = AppDevelopmentRepository;