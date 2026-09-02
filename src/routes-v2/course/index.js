/** @format */

const course = require("express").Router();

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
course.get("/", list);
course.get("/public/filters", public_filters);
course.get("/public", public_list);
course.get("/public/:id", public_detail);
course.get("/:id", detail);

// POST
course.post("/", islogin, create);

// PUT
course.put("/:id", islogin, update);

// DELETE
course.delete("/:id", islogin, remove);

module.exports = course;