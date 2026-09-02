/** @format */

const gallery = require("express").Router();

const {
  gallery_list,
  gallery_list_admin,
  gallery_detail,
  gallery_add,
  gallery_adjust,
  gallery_takedown,
} = require("./controller");

const { islogin } = require("../../middleware/privilege");

gallery.get("/public/list", gallery_list);
gallery.get("/list", islogin, gallery_list_admin);
gallery.get("/detail/:id", islogin, gallery_detail);
gallery.post("/add", islogin, gallery_add);
gallery.put("/adjust/:id", islogin, gallery_adjust);
gallery.delete("/takedown/:id", islogin, gallery_takedown);

module.exports = gallery;
