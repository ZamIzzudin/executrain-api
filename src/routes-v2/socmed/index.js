/** @format */

const socmed = require("express").Router();

const { socmed_list, socmed_detail, adjust } = require("./controller");
const { islogin } = require("../../middleware/privilege");

socmed.get("/list", islogin, socmed_list);
socmed.get("/detail/:id", islogin, socmed_detail);
socmed.get("/public/list", socmed_list);
socmed.put("/adjust/:id", islogin, adjust);

module.exports = socmed;
