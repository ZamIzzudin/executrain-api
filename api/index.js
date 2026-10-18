/** @format */

// =========================================================================
// Vercel Serverless Entrypoint
// =========================================================================
// Vercel memanggil handler ini (tanpa .listen). Semua request diarahkan ke
// sini lewat rewrite di vercel.json, lalu diteruskan ke Express app yang
// sama dengan yang dipakai deployment container (server.js).
// =========================================================================

const app = require("../src/app");

module.exports = app;
