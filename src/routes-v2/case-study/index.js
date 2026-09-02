/** @format */

const caseStudy = require("express").Router();

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
caseStudy.get("/", list);
caseStudy.get("/public/filters", public_filters);
caseStudy.get("/public", public_list);
caseStudy.get("/public/:id", public_detail);
caseStudy.get("/:id", detail);

// POST
caseStudy.post("/", islogin, create);

// PUT
caseStudy.put("/:id", islogin, update);

// DELETE
caseStudy.delete("/:id", islogin, remove);

module.exports = caseStudy;