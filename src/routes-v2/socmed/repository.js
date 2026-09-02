/** @format */

const prisma = require("../../config/prisma");

const socmedSelect = {
  id: true,
  socmed_name: true,
  socmed_link: true,
  logo: true,
};

const SocmedRepository = {
  findAll() {
    return prisma.socmed.findMany({ select: socmedSelect });
  },
  findById(id) {
    return prisma.socmed.findUnique({ where: { id } });
  },
  findByName(socmed_name) {
    return prisma.socmed.findFirst({ where: { socmed_name } });
  },
  update(id, data) {
    return prisma.socmed.update({ where: { id }, data });
  },
};

module.exports = SocmedRepository;
