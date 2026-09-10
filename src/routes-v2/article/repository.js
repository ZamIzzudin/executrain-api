/** @format */

// =========================================================================
// Article Repository (PostgreSQL / Prisma)
// =========================================================================

const prisma = require("../../config/prisma");

const ArticleRepository = {
  count() {
    return prisma.article.count();
  },

  findById(id) {
    return prisma.article.findUnique({
      where: { id },
    });
  },

  search(query) {
    return prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { created_at: "desc" },
    });
  },

  findAll() {
    return prisma.article.findMany({
      orderBy: { created_at: "desc" },
    });
  },

  /**
   * Public paginated list (dipakai compro).
   * Query: ?page=&limit=&category=&search=&sort=
   */
  async publicList({ page = 1, limit = 9, category, search, sort }) {
    const take = Math.max(1, parseInt(limit, 10));
    const current = Math.max(1, parseInt(page, 10));
    const skip = (current - 1) * take;

    const where = {};
    if (category) where.category = { has: category };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy =
      sort === "oldest" ? { created_at: "asc" } : { created_at: "desc" };

    const [total, items] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
    ]);

    const total_pages = Math.max(1, Math.ceil(total / take));

    return {
      data: items,
      pagination: {
        current_page: current,
        total_pages,
        total_products: total,
        per_page: take,
        has_next: current < total_pages,
        has_prev: current > 1,
      },
    };
  },

  /** Opsi filter publik dari master data ARTICLE_CATEGORY. */
  async filters() {
    const categories = await prisma.masterData.findMany({
      where: { type: "ARTICLE_CATEGORY" },
      orderBy: { sort_order: "asc" },
      select: { value: true, label: true },
    });

    return {
      categories: categories.map((r) => ({ value: r.value, label: r.label })),
    };
  },

  create(data) {
    return prisma.article.create({
      data,
    });
  },

  update(id, data) {
    return prisma.article.update({
      where: { id },
      data,
    });
  },

  remove(id) {
    return prisma.article.delete({ where: { id } });
  },

  /** Hitung artikel lain yang kontennya masih memakai URL gambar tertentu */
  countContentContains(url, excludeId) {
    return prisma.article.count({
      where: {
        content: { contains: url },
        NOT: { id: excludeId },
      },
    });
  },
};

module.exports = ArticleRepository;
