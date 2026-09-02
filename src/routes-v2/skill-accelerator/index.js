/** @format */

const skillAccelerator = require("express").Router();

const {
  list,
  public_list,
  public_detail,
  public_filters,
  detail,
  create,
  update,
  remove,
} = require("./controller");

const { islogin } = require("../../middleware/privilege");

// GET
skillAccelerator.get("/", list);
skillAccelerator.get("/public/filters", public_filters);
skillAccelerator.get("/public", public_list);
skillAccelerator.get("/public/:id", public_detail);
skillAccelerator.get("/:id", detail);

// POST
skillAccelerator.post("/", islogin, create);

// PUT
skillAccelerator.put("/:id", islogin, update);

// DELETE
skillAccelerator.delete("/:id", islogin, remove);

module.exports = skillAccelerator;
