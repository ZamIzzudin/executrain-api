/** @format */

const router = require("express").Router();

const { submit_product_inquiry } = require("./controller");

router.post("/public/submit", submit_product_inquiry);

module.exports = router;
