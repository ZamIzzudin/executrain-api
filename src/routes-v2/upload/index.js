/** @format */

const upload = require("express").Router();

const { upload_file, delete_file } = require("./controller");
const { islogin } = require("../../middleware/privilege");

// POST - Protected (upload gambar dengan kompresi & batas 2MB)
upload.post("/", islogin, upload_file);

// DELETE - Protected (hapus gambar dari storage via public_id/url)
upload.delete("/", islogin, delete_file);

module.exports = upload;