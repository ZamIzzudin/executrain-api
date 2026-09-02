/** @format */

const PartnerRepository = require("./repository");
const { upload } = require("../../lib/cd");

const partner_list = async (req, res) => {
  try {
    const partners = await PartnerRepository.findAll();
    res.status(200).json({ status: 200, message: "success", data: partners });
  } catch (error) {
    console.log(error);
    res.status(200).json({ status: 200, data: [], message: "No Products Found" });
  }
};

const partner_detail = async (req, res) => {
  const { id } = req.params;
  try {
    const partner = await PartnerRepository.findById(id);
    if (!partner) {
      return res
        .status(200)
        .json({ status: 200, data: {}, message: "No Partner Found" });
    }
    res.status(200).json({ status: 200, message: "success", data: partner });
  } catch (error) {
    console.log(error);
    res.status(200).json({ status: 200, data: {}, message: "No Partner Found" });
  }
};

const add = async (req, res) => {
  const { partner_name } = req.body;
  try {
    const payload = { partner_name };

    if (req.files) {
      const { url_picture, url_public } = await upload(req.files.file);
      payload.logo = { public_id: url_public, url: url_picture };
    }

    const partner = await PartnerRepository.create(payload);
    res.status(201).json({ status: 201, message: "success", data: partner });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 400,
      message: "failed to create an partner",
    });
  }
};

const adjust = async (req, res) => {
  const { id } = req.params;
  const { partner_name } = req.body;
  const payload = { partner_name, updated_at: new Date() };

  try {
    if (req.files && req.files.file) {
      const { url_picture, url_public } = await upload(req.files.file);
      payload.logo = { public_id: url_public, url: url_picture };
    } else if (req.body.logo && req.body.logo !== "undefined") {
      payload.logo = JSON.parse(req.body.logo);
    } else {
      payload.logo = { public_id: "", url: "" };
    }

    await PartnerRepository.update(id, payload);
    res.status(200).json({
      status: 200,
      message: `successfully update partner ${id}`,
    });
  } catch (err) {
    return res.status(404).json({
      status: 404,
      message: "failed to update partner",
    });
  }
};

const takedown = async (req, res) => {
  const { id } = req.params;
  try {
    await PartnerRepository.remove(id);
    res.status(200).json({
      status: 200,
      message: `successfully takedown partner ${id}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 400,
      message: "Partner Not Found",
    });
  }
};

module.exports = { add, partner_list, partner_detail, adjust, takedown };
