/** @format */

const testimonial = require("express").Router();

const {
  add,
  testimonial_list,
  testimonial_detail,
  adjust,
  takedown,
} = require("./controller");

const { islogin } = require("../../middleware/privilege");

testimonial.get("/list", islogin, testimonial_list);
testimonial.get("/detail/:id", islogin, testimonial_detail);
testimonial.get("/public/list", testimonial_list);
testimonial.post("/add", islogin, add);
testimonial.put("/adjust/:id", islogin, adjust);
testimonial.delete("/takedown/:id", islogin, takedown);

module.exports = testimonial;
