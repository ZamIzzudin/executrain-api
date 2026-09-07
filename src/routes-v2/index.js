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
const skillAccelerator = require("./skill-accelerator");
const course = require("./course");
const upload = require("./upload");
const masterData = require("./master-data");
const itProduct = require("./it-product");
const appDevelopment = require("./app-development");
const caseStudy = require("./case-study");
const article = require("./article");
const assets = require("./assets");
const career = require("./career");
const gallery = require("./gallery");
const partner = require("./partner");
const socmed = require("./socmed");
const statistic = require("./statistic");
const testimonial = require("./testimonial");
const contact = require("./contact");
const scheduleRegistration = require("./schedule-registration");
const productInquiry = require("./product-inquiry");
const access = require("./access");
const page = require("./page");
const schedule = require("./schedule");

// Health check koneksi PostgreSQL
routes.use("/health", health);

// All modules
routes.use("/auth", auth);
routes.use("/skill-accelerator", skillAccelerator);
routes.use("/course", course);
routes.use("/upload", upload);
routes.use("/master-data", masterData);
routes.use("/it-product", itProduct);
routes.use("/app-development", appDevelopment);
routes.use("/case-study", caseStudy);
routes.use("/article", article);
routes.use("/assets", assets);
routes.use("/career", career);
routes.use("/gallery", gallery);
routes.use("/partner", partner);
routes.use("/socmed", socmed);
routes.use("/stat", statistic);
routes.use("/testimonial", testimonial);
routes.use("/contact", contact);
routes.use("/schedule-registration", scheduleRegistration);
routes.use("/product-inquiry", productInquiry);
routes.use("/access", access);
routes.use("/page", page);
routes.use("/schedule", schedule);

module.exports = routes;
