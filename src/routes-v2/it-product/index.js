/** @format */

const itProduct = require("express").Router();

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
itProduct.get("/", list);
itProduct.get("/public/filters", public_filters);
itProduct.get("/public", public_list);
itProduct.get("/public/:id", public_detail);
itProduct.get("/:id", detail);

// POST
itProduct.post("/", islogin, create);

// PUT
itProduct.put("/:id", islogin, update);

// DELETE
itProduct.delete("/:id", islogin, remove);

module.exports = itProduct;
