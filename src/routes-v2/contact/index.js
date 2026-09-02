/** @format */

const contact = require("express").Router();

const { submit_contact } = require("./controller");

contact.post("/public/submit", submit_contact);

module.exports = contact;
