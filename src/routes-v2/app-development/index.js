/** @format */

const appDevelopment = require("express").Router();

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
appDevelopment.get("/", list);
appDevelopment.get("/public/filters", public_filters);
appDevelopment.get("/public", public_list);
appDevelopment.get("/public/:id", public_detail);
appDevelopment.get("/:id", detail);

// POST
appDevelopment.post("/", islogin, create);

// PUT
appDevelopment.put("/:id", islogin, update);

// DELETE
appDevelopment.delete("/:id", islogin, remove);

module.exports = appDevelopment;