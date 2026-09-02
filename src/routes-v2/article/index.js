/** @format */

const article = require("express").Router();

const { list, detail, create, update, remove } = require("./controller");

const { islogin } = require("../../middleware/privilege");

// GET
article.get("/", list);
article.get("/:id", detail);

// POST
article.post("/", islogin, create);

// PUT
article.put("/:id", islogin, update);

// DELETE
article.delete("/:id", islogin, remove);

module.exports = article;
