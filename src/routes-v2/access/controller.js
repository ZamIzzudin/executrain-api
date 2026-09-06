/** @format */

// =========================================================================
// Access Controller (RBAC)
// =========================================================================
// Role management + menu permission.
// Endpoint admin (roles/menus) dilindungi islogin + isSuperAdmin.
// my-menus: dipakai CMS untuk render sidebar sesuai role user login.
// =========================================================================

const prisma = require("../../config/prisma");
const { RoleRepository, MenuRepository } = require("./repository");

// Menu yang hanya boleh diakses role SUPERADMIN (halaman & API-nya
// khusus superadmin). Users & Role Management kini berada di bawah parent
// "access". Non-super tidak boleh melihat/mendapat menu ini di my-menus
// dan dikunci di UI Role Management.
const SUPERADMIN_ONLY_MENUS = new Set(["access", "users", "roles"]);

/** GET /access/roles — daftar role + permission menu ids */
const listRoles = async (req, res) => {
  try {
    const roles = await RoleRepository.findAll();

    const data = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      is_system: r.is_system,
      is_active: r.is_active,
      created_at: r.created_at,
      updated_at: r.updated_at,
      user_count: r._count?.users ?? 0,
      menu_ids: (r.permissions ?? []).map((p) => p.menu_id),
    }));

    return res.status(200).json({ status: 200, message: "success", data });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

/** POST /access/roles — buat role baru + permission */
const createRole = async (req, res) => {
  const { name, description, menu_ids } = req.body;

  try {
    if (!name || !String(name).trim()) {
      return res
        .status(400)
        .json({ status: 400, message: "role name is required" });
    }

    const exists = await RoleRepository.findByName(name);
    if (exists) {
      return res.status(400).json({
        status: 400,
        message: "role name already exists",
      });
    }

    // Pastikan semua role memiliki menu "home" (halaman utama)
    const allMenus = await MenuRepository.findAll();
    const home = allMenus.find((m) => m.code === "home");
    const menuSet = new Set(Array.isArray(menu_ids) ? menu_ids : []);
    if (home) menuSet.add(home.id);
    // Role baru tidak mungkin SUPERADMIN — buang menu khusus superadmin.
    allMenus
      .filter((m) => SUPERADMIN_ONLY_MENUS.has(m.code))
      .forEach((m) => menuSet.delete(m.id));
    const finalMenuIds = Array.from(menuSet);

    const role = await RoleRepository.create({
      name: String(name).trim(),
      description: description ? String(description) : null,
      menu_ids: finalMenuIds,
    });

    return res.status(201).json({
      status: 201,
      message: "success",
      data: { id: role.id, name: role.name },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

/** PUT /access/roles/:id — update role + permission */
const updateRole = async (req, res) => {
  const { id } = req.params;
  const { name, description, is_active, menu_ids } = req.body;

  try {
    const existing = await RoleRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ status: 404, message: "role not found" });
    }

    // Role system (SUPERADMIN/ADMIN) tidak boleh dinonaktifkan/diubah nama seenaknya
    if (existing.is_system) {
      if (name && name !== existing.name) {
        return res
          .status(400)
          .json({ status: 400, message: "system role name cannot be changed" });
      }
      if (is_active === false) {
        return res
          .status(400)
          .json({ status: 400, message: "system role cannot be deactivated" });
      }
    }

    const allMenus = await MenuRepository.findAll();
    const home = allMenus.find((m) => m.code === "home");
    const menuSet = new Set(Array.isArray(menu_ids) ? menu_ids : []);
    if (home) menuSet.add(home.id);
    // Role non-SUPERADMIN tidak boleh diberi menu khusus superadmin.
    if (!(existing.is_system && existing.name === "SUPERADMIN")) {
      allMenus
        .filter((m) => SUPERADMIN_ONLY_MENUS.has(m.code))
        .forEach((m) => menuSet.delete(m.id));
    }

    const role = await RoleRepository.update(id, {
      name: name ? String(name).trim() : existing.name,
      description:
        description !== undefined ? String(description) : existing.description,
      is_active:
        is_active !== undefined
          ? Boolean(is_active)
          : existing.is_active,
      menu_ids: menu_ids !== undefined ? Array.from(menuSet) : undefined,
    });
    return res.status(200).json({
      status: 200,
      message: "success",
      data: { id: role.id, name: role.name },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

/** DELETE /access/roles/:id — hapus role (non-system) */
const deleteRole = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await RoleRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ status: 404, message: "role not found" });
    }

    if (existing.is_system) {
      return res.status(400).json({
        status: 400,
        message: "system role cannot be deleted",
      });
    }

    const userCount = existing._count?.users ?? 0;
    if (userCount > 0) {
      return res.status(400).json({
        status: 400,
        message: `role is assigned to ${userCount} user(s), reassign them first`,
      });
    }

    await RoleRepository.remove(id);
    return res
      .status(200)
      .json({ status: 200, message: `role ${id} deleted successfully` });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

/** GET /access/menus — daftar semua menu tersedia */
const listMenus = async (_req, res) => {
  try {
    const menus = await MenuRepository.findAll();

    return res.status(200).json({
      status: 200,
      message: "success",
      data: menus.map((m) => ({
        id: m.id,
        code: m.code,
        label: m.label,
        path: m.path,
        icon: m.icon,
        parent_code: m.parent_code,
        sort_order: m.sort_order,
        is_active: m.is_active,
        is_superadmin_only: SUPERADMIN_ONLY_MENUS.has(m.code),
      })),
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

/**
 * GET /access/my-menus — menu untuk user yang sedang login.
 * SUPERADMIN selalu dapat semua menu; role lain sesuai RoleMenu.
 * Response berupa tree (parent -> children) siap render di sidebar.
 */
const myMenus = async (req, res) => {
  try {
    const token = req.token;
    const user = await prisma.user.findUnique({
      where: { id: token.id },
      select: {
        id: true,
        role_id: true,
        role: {
          select: {
            id: true,
            name: true,
            is_system: true,
            is_active: true,
            permissions: {
              where: { menu: { is_active: true } },
              select: {
                menu: {
                  select: {
                    id: true,
                    code: true,
                    label: true,
                    path: true,
                    icon: true,
                    parent_code: true,
                    sort_order: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return res.status(400).json({ status: 400, message: "User not found" });
    }

    const isSuper = user.role.name === "SUPERADMIN";
    const allActive = await MenuRepository.findAll(true);
    let selected;
    if (isSuper) {
      selected = allActive;
    } else {
      const granted = (user.role.permissions ?? []).map((p) => p.menu);
      // Pastikan menu induk ikut tampil bila setidaknya satu anaknya dipilih.
      // RoleMenu lama bisa saja hanya berisi baris anak, sehingga parent
      // perlu dicari dari katalog menu global supaya tree sidebar utuh.
      const childParentCodes = new Set(
        granted.filter((m) => m.parent_code).map((m) => m.parent_code),
      );
      const parentExtras = allActive.filter(
        (m) =>
          !m.parent_code &&
          childParentCodes.has(m.code) &&
          !granted.some((g) => g.id === m.id),
      );
      selected = [...granted, ...parentExtras];
      // Non-super tidak pernah melihat menu khusus SUPERADMIN (Users,
      // Role Management) walaupun role-nya kebetulan punya permission tsb.
      selected = selected.filter((m) => !SUPERADMIN_ONLY_MENUS.has(m.code));
    }

    // Susun tree parent->children
    const sortByOrder = (a, b) => a.sort_order - b.sort_order;
    const parents = selected
      .filter((m) => !m.parent_code)
      .sort(sortByOrder)
      .map((m) => ({
        id: m.id,
        code: m.code,
        label: m.label,
        path: m.path,
        icon: m.icon,
        children: selected
          .filter((c) => c.parent_code === m.code)
          .sort(sortByOrder)
          .map((c) => ({
            id: c.id,
            code: c.code,
            label: c.label,
            path: c.path,
            icon: c.icon,
          })),
      }));

    return res.status(200).json({
      status: 200,
      message: "success",
      role: user.role.name,
      data: parents,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

/** GET /access/role-options — daftar role aktif utk dropdown (register/adjust user) */
const roleOptions = async (_req, res) => {
  try {
    const roles = await prisma.role.findMany({
      where: { is_active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return res.status(200).json({ status: 200, message: "success", data: roles });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

module.exports = {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listMenus,
  myMenus,
  roleOptions,
};
