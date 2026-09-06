/** @format */

const access = require("express").Router();

const {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listMenus,
  myMenus,
  roleOptions,
} = require("./controller");

const { islogin, isSuperAdmin } = require("../../middleware/privilege");

// Admin RBAC (SUPERADMIN only)
access.get("/roles", islogin, isSuperAdmin, listRoles);
access.post("/roles", islogin, isSuperAdmin, createRole);
access.put("/roles/:id", islogin, isSuperAdmin, updateRole);
access.delete("/roles/:id", islogin, isSuperAdmin, deleteRole);
access.get("/menus", islogin, isSuperAdmin, listMenus);
access.get("/role-options", islogin, roleOptions);

// User login: menu yang boleh diakses
access.get("/my-menus", islogin, myMenus);

module.exports = access;