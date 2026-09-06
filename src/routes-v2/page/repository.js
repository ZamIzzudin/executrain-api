/** @format */

const prisma = require("../../config/prisma");

const PageContentRepository = {
  async findByCode(code) {
    return prisma.pageContent.findUnique({ where: { code } });
  },

  async findActiveByCode(code) {
    return prisma.pageContent.findFirst({
      where: { code, is_active: true },
    });
  },

  async findAll() {
    return prisma.pageContent.findMany({ orderBy: { code: "asc" } });
  },

  async upsertByCode(code, data) {
    const existing = await prisma.pageContent.findUnique({ where: { code } });
    if (existing) {
      return prisma.pageContent.update({ where: { code }, data });
    }
    return prisma.pageContent.create({ data: { code, ...data } });
  },

  async update(code, data) {
    return prisma.pageContent.update({ where: { code }, data });
  },
};

module.exports = PageContentRepository;