/** @format */

const prisma = require("../../config/prisma");

const partnerSelect = {
  id: true,
  partner_name: true,
  logo: true,
};

const PartnerRepository = {
  findAll() {
    return prisma.partner.findMany({ select: partnerSelect });
  },
  findById(id) {
    return prisma.partner.findUnique({ where: { id } });
  },
  create(data) {
    return prisma.partner.create({ data });
  },
  update(id, data) {
    return prisma.partner.update({ where: { id }, data });
  },
  remove(id) {
    return prisma.partner.delete({ where: { id } });
  },
};

module.exports = PartnerRepository;
