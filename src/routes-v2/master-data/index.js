/** @format */

const masterData = require("express").Router();

const {
  list,
  listByType,
  create,
  update,
  remove,
} = require("./controller");

const { islogin } = require("../../middleware/privilege");

// GET
masterData.get("/", list); // ?type=SKILL_CATEGORY
masterData.get("/:type", listByType); // public: GET /master-data/SKILL_CATEGORY

// POST
masterData.post("/", islogin, create);

// PUT
masterData.put("/:id", islogin, update);

// DELETE
masterData.delete("/:id", islogin, remove);

module.exports = masterData;
