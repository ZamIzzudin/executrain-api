/** @format */

const learningPath = require("express").Router();

const {
  list,
  public_list,
  detail,
  public_detail,
  course_options,
  framework_options,
  create,
  update,
  remove,
} = require("./controller");

const { islogin } = require("../../middleware/privilege");

// GET
learningPath.get("/", islogin, list);
learningPath.get("/public", public_list);
learningPath.get("/public/:id", public_detail);
learningPath.get("/framework-options", framework_options);
learningPath.get("/course-options", course_options);
learningPath.get("/:id", islogin, detail);

// POST
learningPath.post("/", islogin, create);

// PUT
learningPath.put("/:id", islogin, update);

// DELETE
learningPath.delete("/:id", islogin, remove);

module.exports = learningPath;
