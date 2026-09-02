/** @format */

// =========================================================================
// AppDevelopment Controller v2 (PostgreSQL / Prisma)
// =========================================================================

const AppDevelopmentRepository = require("./repository");

/**
 * Normalisasi team_size: pastikan array objek { quantity, type }.
 */
function normalizeTeamSize(team_size) {
  if (!Array.isArray(team_size)) return [];
  return team_size
    .filter((t) => t && typeof t === "object")
    .map((t) => ({
      quantity: t.quantity !== undefined ? parseInt(t.quantity, 10) || 0 : 0,
      type: t.type || "",
    }));
}

/**
 * Normalisasi highlights: pastikan array objek { image, title, description }.
 */
function normalizeHighlights(highlights) {
  if (!Array.isArray(highlights)) return [];
  return highlights
    .filter((h) => h && typeof h === "object")
    .map((h) => ({
      image: h.image || "",
      title: h.title || "",
      description: h.description || "",
    }));
}

const list = async (req, res) => {
  try {
    const { search } = req.query;
    const data = search
      ? await AppDevelopmentRepository.search(search)
      : await AppDevelopmentRepository.findAll();

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
      message: "No App Development Found",
    });
  }
};

/**
 * Public paginated list (dipakai compro nanti).
 * Query: ?page=&limit=&tech_stack=&search=
 */
const public_list = async (req, res) => {
  try {
    const { page, limit, tech_stack, search } = req.query;
    const result = await AppDevelopmentRepository.publicList({
      page,
      limit,
      tech_stack,
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
      message: "No App Development Found",
    });
  }
};

const public_detail = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await AppDevelopmentRepository.findById(id);
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "App Development not found",
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
 * Opsi filter publik: tech stack & methodology dari master data.
 */
const public_filters = async (req, res) => {
  try {
    const data = await AppDevelopmentRepository.filters();

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
    const data = await AppDevelopmentRepository.findById(id);
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "App Development not found",
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
    tech_stack,
    description,
    challenge,
    team_size,
    timeline,
    methodology,
    compliance,
    highlights,
  } = req.body;

  try {
    const data = await AppDevelopmentRepository.create({
      title,
      tech_stack: tech_stack || [],
      description,
      challenge: challenge || null,
      team_size: normalizeTeamSize(team_size),
      timeline: timeline ? parseInt(timeline, 10) : 0,
      methodology: methodology || null,
      compliance: compliance || null,
      highlights: normalizeHighlights(highlights),
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
      message: "failed to create app development",
      info: error.message,
    });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    tech_stack,
    description,
    challenge,
    team_size,
    timeline,
    methodology,
    compliance,
    highlights,
  } = req.body;

  try {
    const existing = await AppDevelopmentRepository.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 404,
        message: "App Development not found",
      });
    }

    const data = await AppDevelopmentRepository.update(id, {
      title: title ?? existing.title,
      tech_stack: tech_stack ?? existing.tech_stack,
      description: description ?? existing.description,
      challenge: challenge !== undefined ? challenge || null : existing.challenge,
      team_size:
        team_size !== undefined
          ? normalizeTeamSize(team_size)
          : existing.team_size,
      timeline:
        timeline !== undefined
          ? parseInt(timeline, 10) || 0
          : existing.timeline,
      methodology:
        methodology !== undefined
          ? methodology || null
          : existing.methodology,
      compliance:
        compliance !== undefined ? compliance || null : existing.compliance,
      highlights:
        highlights !== undefined
          ? normalizeHighlights(highlights)
          : existing.highlights,
      updated_at: new Date(),
    });

    return res.status(200).json({
      status: 200,
      message: `successfully update app development ${id}`,
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "failed to update app development",
      info: error.message,
    });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;

  try {
    await AppDevelopmentRepository.remove(id);

    return res.status(200).json({
      status: 200,
      message: `successfully takedown app development ${id}`,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "app development not found",
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