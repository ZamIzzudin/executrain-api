/** @format */

const article = require("express").Router();

const { list, public_list, public_detail, public_filters, detail, create, update, remove } = require("./controller");

const { islogin } = require("../../middleware/privilege");

// GET
article.get("/", list);
article.get("/public/filters", public_filters);
article.get("/public", public_list);
article.get("/public/:id", public_detail);
article.get("/:id", detail);

// POST
article.post("/", islogin, create);

// PUT
article.put("/:id", islogin, update);

// DELETE
article.delete("/:id", islogin, remove);

module.exports = article;
