/** @format */

const career = require("express").Router();

const {
  add,
  career_list,
  career_detail,
  career_by_slug,
  adjust,
  takedown,
  apply_job,
  applicants_list,
  applicant_detail,
  update_applicant_status,
  delete_applicant,
  gallery_list,
  gallery_list_admin,
  gallery_detail,
  gallery_add,
  gallery_adjust,
  gallery_takedown,
} = require("./controller");

const { islogin } = require("../../middleware/privilege");

// GET - Career Listings
career.get("/list", islogin, career_list);
career.get("/detail/:id", islogin, career_detail);
career.get("/public/list", career_list);
career.get("/public/detail/:id", career_detail);
career.get("/public/slug/:slug", career_by_slug);

// GET - Applicants (Protected)
career.get("/:career_id/applicants", islogin, applicants_list);
career.get("/applicant/:id", islogin, applicant_detail);

// POST - Career Management (Protected)
career.post("/add", islogin, add);

// POST - Apply for Job (Public)
career.post("/apply", apply_job);

// PUT - Career Management (Protected)
career.put("/adjust/:id", islogin, adjust);

// PUT - Update Applicant Status (Protected)
career.put("/applicant/:id/status", islogin, update_applicant_status);

// DELETE - Career Management (Protected)
career.delete("/takedown/:id", islogin, takedown);

// DELETE - Applicant Management (Protected)
career.delete("/applicant/:id", islogin, delete_applicant);

// GET - Gallery (Public)
career.get("/gallery/list", gallery_list);
career.get("/gallery/list/admin", islogin, gallery_list_admin);
career.get("/gallery/detail/:id", islogin, gallery_detail);

// POST - Gallery Management (Protected)
career.post("/gallery/add", islogin, gallery_add);

// PUT - Gallery Management (Protected)
career.put("/gallery/adjust/:id", islogin, gallery_adjust);

// DELETE - Gallery Management (Protected)
career.delete("/gallery/takedown/:id", islogin, gallery_takedown);

module.exports = career;
