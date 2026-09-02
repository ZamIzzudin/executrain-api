/** @format */

// Statistic v2: singleton-style (mirip v1 dengan defaultID)
const prisma = require("../../config/prisma");

// Default ID untuk statistic (sama dengan v1: 690ac2ccc2a5939216f11672)
// Akan dipakai jika ada; jika tidak ada, fallback ke record pertama
const DEFAULT_STAT_ID = "690ac2ccc2a5939216f11672";

const StatisticRepository = {
  async findDefault() {
    const byId = await prisma.statistic.findUnique({
      where: { id: DEFAULT_STAT_ID },
    });
    if (byId) return byId;
    return prisma.statistic.findFirst();
  },
  update(id, data) {
    return prisma.statistic.update({ where: { id }, data });
  },
};

module.exports = StatisticRepository;
module.exports.DEFAULT_STAT_ID = DEFAULT_STAT_ID;
