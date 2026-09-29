/** @format */

const schedule = require("express").Router();

const {
  list,
  calendar_list,
  options,
  detail,
  public_dates,
  public_list,
  add,
  add_bulk,
  add_range,
  adjust,
  adjust_range,
  takedown,
  takedown_many,
} = require("./controller");

const { islogin } = require("../../middleware/privilege");
const {
  download_template,
  import_preview,
  import_confirm,
} = require("./import-controller");

// Public (compro) — tanpa auth
schedule.get("/public/list", public_list);
schedule.get("/public/:type/:entityId", public_dates);

// Admin CMS
schedule.get("/list", islogin, list);
schedule.get("/calendar", islogin, calendar_list);
schedule.get("/options", islogin, options);
schedule.get("/detail/:id", islogin, detail);

// POST
schedule.post("/add", islogin, add);
schedule.post("/add-bulk", islogin, add_bulk);
schedule.post("/range", islogin, add_range);

// PUT
schedule.put("/adjust/:id", islogin, adjust);
schedule.put("/adjust-range/:id", islogin, adjust_range);

// Bulk import Excel
schedule.get("/template", islogin, download_template);
schedule.post("/import/preview", islogin, import_preview);
schedule.post("/import/confirm", islogin, import_confirm);

// DELETE
schedule.delete("/takedown/:id", islogin, takedown);
schedule.delete("/takedown-many", islogin, takedown_many);

module.exports = schedule;