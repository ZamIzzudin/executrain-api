/** @format */

const TestimonialRepository = require("./repository");
const { upload } = require("../../lib/cd");

const testimonial_list = async (req, res) => {
  try {
    const testimonials = await TestimonialRepository.findAll();
    res
      .status(200)
      .json({ status: 200, message: "success", data: testimonials });
  } catch (error) {
    console.log(error);
    res
      .status(200)
      .json({ status: 200, data: [], message: "No Testimonials Found" });
  }
};

const testimonial_detail = async (req, res) => {
  const { id } = req.params;
  try {
    const testimonial = await TestimonialRepository.findById(id);
    if (!testimonial) {
      return res
        .status(200)
        .json({ status: 200, data: {}, message: "No Testimonial Found" });
    }
    res
      .status(200)
      .json({ status: 200, message: "success", data: testimonial });
  } catch (error) {
    console.log(error);
    res
      .status(200)
      .json({ status: 200, data: {}, message: "No Testimonial Found" });
  }
};

const add = async (req, res) => {
  const { person_name, person_title, testimonial } = req.body;
  try {
    const payload = { person_name, person_title, testimonial };

    if (req.files) {
      const { url_picture, url_public } = await upload(req.files.file);
      payload.photo = { public_id: url_public, url: url_picture };
    }

    const t = await TestimonialRepository.create(payload);
    res.status(201).json({ status: 201, message: "success", data: t });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 400,
      message: "failed to create an testimonial",
    });
  }
};

const adjust = async (req, res) => {
  const { id } = req.params;
  const { person_name, person_title, testimonial } = req.body;
  const payload = {
    person_name,
    person_title,
    testimonial,
    updated_at: new Date(),
  };

  try {
    if (req.files && req.files.file) {
      const { url_picture, url_public } = await upload(req.files.file);
      payload.photo = { public_id: url_public, url: url_picture };
    } else if (req.body.photo && req.body.photo !== "undefined") {
      payload.photo = JSON.parse(req.body.photo);
    } else {
      payload.photo = { public_id: "", url: "" };
    }

    await TestimonialRepository.update(id, payload);
    res.status(200).json({
      status: 200,
      message: `successfully update testimonial ${id}`,
    });
  } catch (err) {
    return res.status(404).json({
      status: 404,
      message: "failed to update testimonial",
    });
  }
};

const takedown = async (req, res) => {
  const { id } = req.params;
  try {
    await TestimonialRepository.remove(id);
    res.status(200).json({
      status: 200,
      message: `successfully takedown testimonial ${id}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 400,
      message: "Testimonial Not Found",
    });
  }
};

module.exports = {
  add,
  testimonial_list,
  testimonial_detail,
  adjust,
  takedown,
};
