/** @format */

// =========================================================================
// MasterData Repository (PostgreSQL / Prisma)
// =========================================================================

const prisma = require("../../config/prisma");

const MasterDataRepository = {
  findById(id) {
    return prisma.masterData.findUnique({ where: { id } });
  },

  findByTypeValue(type, value, scope) {
    return prisma.masterData.findFirst({
      where: scope ? { type, value, scope } : { type, value },
    });
  },

  findByType(type, scope) {
    return prisma.masterData.findMany({
      where: scope ? { type, scope } : { type },
      orderBy: [{ scope: "asc" }, { sort_order: "asc" }],
    });
  },

  findAll() {
    return prisma.masterData.findMany({
      orderBy: [{ type: "asc" }, { sort_order: "asc" }],
    });
  },

  create(data) {
    return prisma.masterData.create({ data });
  },

  update(id, data) {
    return prisma.masterData.update({
      where: { id },
      data: { ...data, updated_at: new Date() },
    });
  },

  remove(id) {
    return prisma.masterData.delete({ where: { id } });
  },
};

module.exports = MasterDataRepository;
