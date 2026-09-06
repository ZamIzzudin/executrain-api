/** @format */

// =========================================================================
// Access Repository (RBAC) — PostgreSQL / Prisma
// =========================================================================

const prisma = require("../../config/prisma");

const roleSelect = {
  id: true,
  name: true,
  description: true,
  is_system: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  _count: {
    select: {
      users: true,
    },
  },
};

const RoleRepository = {
  findAll() {
    return prisma.role.findMany({
      select: {
        ...roleSelect,
        permissions: {
          select: {
            menu_id: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });
  },

  findById(id) {
    return prisma.role.findUnique({
      where: { id },
      select: {
        ...roleSelect,
        permissions: {
          select: {
            menu_id: true,
          },
        },
      },
    });
  },

  findByName(name) {
    return prisma.role.findUnique({ where: { name } });
  },

  /**
   * Buat role baru + permission (menu ids).
   * Transaction: role + roleMenu bulk.
   */
  create({ name, description, menu_ids }) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name,
          description: description || null,
        },
      });

      if (menu_ids && menu_ids.length > 0) {
        await tx.roleMenu.createMany({
          data: menu_ids.map((menu_id) => ({ role_id: role.id, menu_id })),
        });
      }

      return role;
    });
  },

  /**
   * Update role (nama/deskripsi/status) + ganti permission.
   * Di dalam transaction: update role, hapus RoleMenu lama, buat baru.
   */
  update(id, { name, description, is_active, menu_ids }) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.update({
        where: { id },
        data: {
          name,
          description: description ?? undefined,
          is_active: is_active ?? undefined,
        },
      });

      if (menu_ids) {
        await tx.roleMenu.deleteMany({ where: { role_id: id } });
        if (menu_ids.length > 0) {
          await tx.roleMenu.createMany({
            data: menu_ids.map((menu_id) => ({ role_id: id, menu_id })),
          });
        }
      }

      return role;
    });
  },

  remove(id) {
    return prisma.role.delete({ where: { id } });
  },
};

const MenuRepository = {
  findAll(onlyActive = false) {
    return prisma.menu.findMany({
      where: onlyActive ? { is_active: true } : undefined,
      orderBy: [{ sort_order: "asc" }],
    });
  },
};

module.exports = { RoleRepository, MenuRepository };
