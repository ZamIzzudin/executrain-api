/** @format */

const auth = require("express").Router();

const {
  genesis,
  me,
  login,
  refresh,
  user_list,
  register,
  adjust,
  takedown,
} = require("./controller");

const { islogin } = require("../../middleware/privilege");

// GET
auth.get("/genesis", genesis);
auth.get("/me", islogin, me);
auth.get("/refresh", islogin, refresh);
auth.get("/list", islogin, user_list);

// POST
auth.post("/login", login);
auth.post("/register", islogin, register);

// PUT
auth.put("/adjust/:id", islogin, adjust);

// DELETE
auth.delete("/takedown/:id", islogin, takedown);

module.exports = auth;
