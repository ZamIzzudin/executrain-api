/** @format */

const assets = require("express").Router();

const {
  asset_list,
  asset_detail,
  asset_all,
  adjust,
  adjust_url,
} = require("./controller");

const { islogin } = require("../../middleware/privilege");

assets.get("/list", asset_list);
assets.get("/all", asset_all);
assets.get("/detail/:category", asset_detail);
assets.put("/adjust/:id", islogin, adjust);
assets.put("/adjust-url/:id", islogin, adjust_url);

module.exports = assets;
