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
  role: {
    select: {
      id: true,
      name: true,
    },
  },
  created_at: true,
};

const AuthRepository = {
  count() {
    return prisma.user.count();
  },

  // Resolve id role dari nama (utk genesis/register default)
  findRoleIdByName(name) {
    return prisma.role.findUnique({
      where: { name },
      select: { id: true },
    });
  },

  // Validasi role id ada
  findRoleById(id) {
    return prisma.role.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
  },

  findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        display_name: true,
        password: true,
        role_id: true,
        role: {
          select: { id: true, name: true },
        },
        created_at: true,
      },
    });
  },

  findByUsername(username) {
    // username bukan unique di schema, gunakan findFirst
    return prisma.user.findFirst({
      where: { username },
      include: {
        role: {
          select: { id: true, name: true },
        },
      },
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
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        display_name: true,
        role_id: true,
        role: {
          select: { id: true, name: true },
        },
        created_at: true,
      },
    });
  },

  create({ username, display_name, role_id, password }) {
    return prisma.user.create({
      data: { username, display_name, role_id, password },
      select: {
        id: true,
        username: true,
        display_name: true,
        role_id: true,
        role: {
          select: { id: true, name: true },
        },
        created_at: true,
      },
    });
  },

  update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        display_name: true,
        role_id: true,
        role: {
          select: { id: true, name: true },
        },
        created_at: true,
      },
    });
  },

  remove(id) {
    return prisma.user.delete({ where: { id } });
  },
};

module.exports = AuthRepository;
