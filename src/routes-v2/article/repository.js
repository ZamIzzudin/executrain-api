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
