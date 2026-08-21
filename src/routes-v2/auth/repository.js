/** @format */

// =========================================================================
// Auth Repository (PostgreSQL / Prisma)
// =========================================================================
// Pattern:
//   - Semua query DB dipusatkan di file ini.
//   - Controller hanya memanggil function di repository, tidak kontak DB
//     langsung.
//   - Function di repo return plain JS object (bukan Prisma instance) agar
//     aman di-serialize ke JSON.
// =========================================================================

const prisma = require("../../config/prisma");

const selectSafe = {
  id: true,
  username: true,
  display_name: true,
  role: true,
  created_at: true,
};

const AuthRepository = {
  count() {
    return prisma.user.count();
  },

  findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: selectSafe,
    });
  },

  findByUsername(username) {
    // username bukan unique di schema, gunakan findFirst
    return prisma.user.findFirst({
      where: { username },
    });
  },

  search(query) {
    return prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { display_name: { contains: query, mode: "insensitive" } },
        ],
      },
      select: selectSafe,
    });
  },

  findAll() {
    return prisma.user.findMany({ select: selectSafe });
  },

  create({ username, display_name, role, password }) {
    return prisma.user.create({
      data: { username, display_name, role, password },
      select: selectSafe,
    });
  },

  update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: selectSafe,
    });
  },

  remove(id) {
    return prisma.user.delete({ where: { id } });
  },
};

module.exports = AuthRepository;
