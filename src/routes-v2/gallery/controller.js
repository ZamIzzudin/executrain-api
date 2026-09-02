/** @format */

const GalleryRepository = require("./repository");
const { upload, destroy } = require("../../lib/cd");

const gallery_list = async (req, res) => {
  try {
    const galleries = await GalleryRepository.findActive();
    res.status(200).json({ status: 200, message: "success", data: galleries });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const gallery_list_admin = async (req, res) => {
  try {
    const galleries = await GalleryRepository.findAll();
    res.status(200).json({ status: 200, message: "success", data: galleries });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const gallery_detail = async (req, res) => {
  const { id } = req.params;
  try {
    const gallery = await GalleryRepository.findById(id);
    if (!gallery) {
      return res
        .status(404)
        .json({ status: 404, message: "Gallery not found", data: null });
    }
    res.status(200).json({ status: 200, message: "success", data: gallery });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

const gallery_add = async (req, res) => {
  const { title, order } = req.body;
  try {
    const payload = {
      title: title || "",
      order: order ? parseInt(order) : 0,
    };
    if (req.files && req.files.file) {
      const { url_picture, url_public } = await upload(req.files.file);
      payload.image = { public_id: url_public, url: url_picture };
    }
    const gallery = await GalleryRepository.create(payload);
    res.status(201).json({ status: 201, message: "success", data: gallery });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

const gallery_adjust = async (req, res) => {
  const { id } = req.params;
  const { title, order, is_active } = req.body;
  try {
    const payload = { updated_at: new Date() };
    if (title !== undefined) payload.title = title;
    if (order !== undefined) payload.order = parseInt(order);
    if (is_active !== undefined)
      payload.is_active = is_active === "true" || is_active === true;

    if (req.files && req.files.file) {
      const { url_picture, url_public } = await upload(req.files.file);
      payload.image = { public_id: url_public, url: url_picture };
    } else if (req.body.image && req.body.image !== "undefined") {
      payload.image = JSON.parse(req.body.image);
    }

    const gallery = await GalleryRepository.update(id, payload);
    res.status(200).json({ status: 200, message: "success", data: gallery });
  } catch (error) {
    console.log(error.message);
    return res.status(404).json({ status: 404, message: "Gallery not found" });
  }
};

const gallery_takedown = async (req, res) => {
  const { id } = req.params;
  try {
    const gallery = await GalleryRepository.findById(id);
    if (!gallery) {
      return res.status(404).json({ status: 404, message: "Gallery not found" });
    }
    if (gallery.image && gallery.image.public_id) {
      await destroy(gallery.image.public_id);
    }
    await GalleryRepository.remove(id);
    res.status(200).json({ status: 200, message: "success" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ status: 500, message: "server error" });
  }
};

module.exports = {
  gallery_list,
  gallery_list_admin,
  gallery_detail,
  gallery_add,
  gallery_adjust,
  gallery_takedown,
};
