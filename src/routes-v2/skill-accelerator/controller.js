/** @format */

// =========================================================================
// Skill Accelerator Controller v2 (PostgreSQL / Prisma)
// =========================================================================

const SkillAcceleratorRepository = require("./repository");

const list = async (req, res) => {
  try {
    const { search } = req.query;
    const data = search
      ? await SkillAcceleratorRepository.search(search)
      : await SkillAcceleratorRepository.findAll();

    return res.status(200).json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(200).json({
      status: 200,
      data: [],
      message: "No Skill Accelerator Found",
    });
  }
};

/**
 * Public paginated list (dipakai compro /skill-accelerator).
 * Query: ?page=&limit=&category=&search=
 */
const public_list = async (req, res) => {
  try {
    const { page, limit, category, search } = req.query;
    const result = await SkillAcceleratorRepository.publicList({
      page,
      limit,
      category,
      search,
    });

    return res.status(200).json({
      status: 200,
      message: "success",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(200).json({
      status: 200,
      data: [],
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_products: 0,
        per_page: 1,
        has_next: false,
        has_prev: false,
      },
      message: "No Skill Accelerator Found",
    });
  }
};

const public_detail = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await SkillAcceleratorRepository.findById(id);
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Skill Accelerator not found",
      });
    }

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
 * Opsi filter publik (enum & nilai nyata di DB) untuk dropdown compro.
 */
const public_filters = async (req, res) => {
  try {
    const data = await SkillAcceleratorRepository.filters();

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

const detail = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await SkillAcceleratorRepository.findById(id);
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Skill Accelerator not found",
      });
    }

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
  const {
    title,
    banner,
    category,
    description,
    student,
    duration,
    skill_level,
    language,
    feature,
  } = req.body;

  try {
    // Banner: ubah string URL menjadi objek { url, public_id } agar konsisten.
    let normalizedBanner = { url: "", public_id: "" };
    if (typeof banner === "string" && banner.trim() !== "") {
      normalizedBanner = { url: banner, public_id: "" };
    } else if (banner && typeof banner === "object") {
      normalizedBanner = banner;
    }

    const data = await SkillAcceleratorRepository.create({
      title,
      banner: normalizedBanner,
      category,
      description,
      student: student ? parseInt(student, 10) : 0,
      duration: duration ? parseInt(duration, 10) : 0,
      skill_level,
      language,
      feature: feature || [],
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
      message: "failed to create skill accelerator",
      info: error.message,
    });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    banner,
    category,
    description,
    student,
    duration,
    skill_level,
    language,
    feature,
  } = req.body;

  try {
    const existing = await SkillAcceleratorRepository.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 404,
        message: "Skill Accelerator not found",
      });
    }

    // Banner: ubah string URL menjadi objek { url, public_id } agar konsisten
    // dengan format create (dan format modul lain).
    let normalizedBanner = existing.banner;
    if (typeof banner === "string" && banner.trim() !== "") {
      normalizedBanner = { url: banner, public_id: "" };
    } else if (banner && typeof banner === "object") {
      normalizedBanner = banner;
    }

    const data = await SkillAcceleratorRepository.update(id, {
      title,
      banner: normalizedBanner,
      category,
      description,
      student: student !== undefined ? parseInt(student, 10) : existing.student,
      duration:
        duration !== undefined ? parseInt(duration, 10) : existing.duration,
      skill_level,
      language,
      feature: feature || existing.feature,
      updated_at: new Date(),
    });

    return res.status(200).json({
      status: 200,
      message: `successfully update skill accelerator ${id}`,
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "failed to update skill accelerator",
      info: error.message,
    });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;

  try {
    await SkillAcceleratorRepository.remove(id);

    return res.status(200).json({
      status: 200,
      message: `successfully takedown skill accelerator ${id}`,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "skill accelerator not found",
    });
  }
};

module.exports = {
  list,
  public_list,
  public_detail,
  public_filters,
  detail,
  create,
  update,
  remove,
};
