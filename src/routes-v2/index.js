/** @format */

// =========================================================================
// v2 Routes - PostgreSQL (Prisma)
// =========================================================================
// Daftar modul ditambahkan bertahap. Saat ini: health + auth.
// Modul lain (product, schedule, article, dll) akan ditambahkan saat
// proses recreate modul-modul CMS berlangsung.
// =========================================================================

const routes = require("express").Router();

const health = require("./health");
const auth = require("./auth");

// Health check koneksi PostgreSQL
routes.use("/health", health);

// All modules
routes.use("/auth", auth);

module.exports = routes;
