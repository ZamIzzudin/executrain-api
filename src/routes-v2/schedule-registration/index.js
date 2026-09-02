/** @format */

const scheduleRegistration = require("express").Router();

const { submit_registration } = require("./controller");

scheduleRegistration.post("/public/submit", submit_registration);

module.exports = scheduleRegistration;
