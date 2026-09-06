/** @format */

const page = require("express").Router();

const { page_detail, admin_detail, page_list, adjust } = require("./controller");
const { islogin } = require("../../middleware/privilege");

// Public
page.get("/public/detail/:code", page_detail);

// Admin (CMS)
page.get("/list", islogin, page_list);
page.get("/detail/:code", islogin, admin_detail);
page.put("/adjust/:code", islogin, adjust);

module.exports = page;