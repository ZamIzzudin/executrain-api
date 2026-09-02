/** @format */

const prisma = require("../../config/prisma");

const AssetRepository = {
  findAll() {
    return prisma.asset.findMany({ orderBy: { category: "asc" } });
  },
  findAllActive() {
    return prisma.asset.findMany({ where: { is_active: true } });
  },
  findByCategory(category) {
    return prisma.asset.findUnique({ where: { category } });
  },
  findById(id) {
    return prisma.asset.findUnique({ where: { id } });
  },
  create(data) {
    return prisma.asset.create({ data });
  },
  createMany(data) {
    return prisma.asset.createMany({ data });
  },
  update(id, data) {
    return prisma.asset.update({ where: { id }, data });
  },
};

module.exports = AssetRepository;
