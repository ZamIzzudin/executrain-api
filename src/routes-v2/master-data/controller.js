/** @format */

// =========================================================================
// MasterData Controller v2
// =========================================================================

const MasterDataRepository = require("./repository");

const list = async (req, res) => {
  try {
    const { type } = req.query;
    const data = type
      ? await MasterDataRepository.findByType(type)
      : await MasterDataRepository.findAll();

    return res.status(200).json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

/**
 * Public: daftar master data per tipe (dipakai compro & CMS form).
 * GET /master-data/:type
 */
const listByType = async (req, res) => {
  try {
    const { type } = req.params;
    const data = await MasterDataRepository.findByType(type);

    return res.status(200).json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

const create = async (req, res) => {
  const { type, label, value, sort_order } = req.body;

  if (!type || !label || !value) {
    return res.status(400).json({
      status: 400,
      message: "type, label and value are required",
    });
  }

  try {
    const existing = await MasterDataRepository.findByTypeValue(type, value);
    if (existing) {
      return res.status(400).json({
        status: 400,
        message: `value '${value}' already exists for type '${type}'`,
      });
    }

    const data = await MasterDataRepository.create({
      type,
      label,
      value,
      sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : 0,
    });

    return res.status(201).json({
      status: 201,
      message: "success",
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "failed to create master data",
      info: error.message,
    });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { type, label, value, sort_order } = req.body;

  try {
    const existing = await MasterDataRepository.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 404,
        message: "master data not found",
      });
    }

    // cegah duplikat (type+value) bila value diubah
    if (value && value !== existing.value) {
      const dup = await MasterDataRepository.findByTypeValue(
        type || existing.type,
        value,
      );
      if (dup) {
        return res.status(400).json({
          status: 400,
          message: `value '${value}' already exists for type '${type || existing.type}'`,
        });
      }
    }

    const data = await MasterDataRepository.update(id, {
      type: type ?? existing.type,
      label: label ?? existing.label,
      value: value ?? existing.value,
      sort_order:
        sort_order !== undefined
          ? parseInt(sort_order, 10)
          : existing.sort_order,
    });

    return res.status(200).json({
      status: 200,
      message: "successfully update master data",
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "failed to update master data",
      info: error.message,
    });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;

  try {
    await MasterDataRepository.remove(id);

    return res.status(200).json({
      status: 200,
      message: "successfully delete master data",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "master data not found",
    });
  }
};

module.exports = {
  list,
  listByType,
  create,
  update,
  remove,
};
