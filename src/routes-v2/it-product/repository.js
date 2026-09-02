/** @format */

// =========================================================================
// ITProduct Repository (PostgreSQL / Prisma)
// =========================================================================

const prisma = require("../../config/prisma");

const ITProductRepository = {
  count() {
    return prisma.iTProduct.count();
  },

  findById(id) {
    return prisma.iTProduct.findUnique({
      where: { id },
    });
  },

  search(query) {
    return prisma.iTProduct.findMany({
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
    return prisma.iTProduct.findMany({
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
      prisma.iTProduct.count({ where }),
      prisma.iTProduct.findMany({
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
   * Opsi filter publik: daftar tech stack dari master data TECH_STACK.
   */
  async filters() {
    const tech_stacks = await prisma.masterData.findMany({
      where: { type: "TECH_STACK" },
      orderBy: { sort_order: "asc" },
      select: { value: true, label: true },
    });

    return {
      tech_stacks: tech_stacks.map((r) => ({
        value: r.value,
        label: r.label,
      })),
    };
  },

  create(data) {
    return prisma.iTProduct.create({
      data,
    });
  },

  update(id, data) {
    return prisma.iTProduct.update({
      where: { id },
      data,
    });
  },

  remove(id) {
    return prisma.iTProduct.delete({ where: { id } });
  },
};

module.exports = ITProductRepository;