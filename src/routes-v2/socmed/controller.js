/** @format */

const SocmedRepository = require("./repository");
const { upload } = require("../../lib/cd");

const socmed_list = async (req, res) => {
  try {
    const socmeds = await SocmedRepository.findAll();
    res.status(200).json({ status: 200, message: "success", data: socmeds });
  } catch (error) {
    console.log(error);
    res
      .status(200)
      .json({ status: 200, data: [], message: "No Social Media Found" });
  }
};

const socmed_detail = async (req, res) => {
  const { id } = req.params;
  try {
    const socmed = await SocmedRepository.findById(id);
    if (!socmed) {
      return res
        .status(200)
        .json({ status: 200, data: {}, message: "No Social Media Found" });
    }
    res.status(200).json({ status: 200, message: "success", data: socmed });
  } catch (error) {
    console.log(error);
    res
      .status(200)
      .json({ status: 200, data: {}, message: "No Social Media Found" });
  }
};

const adjust = async (req, res) => {
  const { id } = req.params;
  const { socmed_name, socmed_link } = req.body;
  const payload = {
    socmed_name,
    socmed_link,
    updated_at: new Date(),
  };

  try {
    if (req.files && req.files.file) {
      const { url_picture, url_public } = await upload(req.files.file);
      payload.logo = { public_id: url_public, url: url_picture };
    } else if (req.body.logo && req.body.logo !== "undefined") {
      payload.logo = JSON.parse(req.body.logo);
    } else {
      payload.logo = { public_id: "", url: "" };
    }

    await SocmedRepository.update(id, payload);
    res.status(200).json({
      status: 200,
      message: `successfully update social media ${id}`,
    });
  } catch (err) {
    return res.status(404).json({
      status: 404,
      message: "failed to update social media",
    });
  }
};

module.exports = { socmed_list, socmed_detail, adjust };
