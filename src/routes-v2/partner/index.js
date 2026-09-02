/** @format */

const partner = require("express").Router();

const {
  add,
  partner_list,
  partner_detail,
  adjust,
  takedown,
} = require("./controller");

const { islogin } = require("../../middleware/privilege");

partner.get("/list", islogin, partner_list);
partner.get("/detail/:id", islogin, partner_detail);
partner.get("/public/list", partner_list);
partner.post("/add", islogin, add);
partner.put("/adjust/:id", islogin, adjust);
partner.delete("/takedown/:id", islogin, takedown);

module.exports = partner;
