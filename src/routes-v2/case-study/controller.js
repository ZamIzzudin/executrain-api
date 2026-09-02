/** @format */

// =========================================================================
// CaseStudy Controller v2 (PostgreSQL / Prisma)
// =========================================================================

const CaseStudyRepository = require("./repository");

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
 * Normalisasi testimonial: pastikan objek { testimoni, name, company }.
 */
function normalizeTestimonial(testimonial) {
  if (!testimonial || typeof testimonial !== "object" || Array.isArray(testimonial))
    return { testimoni: "", name: "", company: "" };
  return {
    testimoni: testimonial.testimoni || "",
    name: testimonial.name || "",
    company: testimonial.company || "",
  };
}

const list = async (req, res) => {
  try {
    const { search } = req.query;
    const data = search
      ? await CaseStudyRepository.search(search)
      : await CaseStudyRepository.findAll();

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
      message: "No Case Study Found",
    });
  }
};

/**
 * Public paginated list (dipakai compro).
 * Query: ?page=&limit=&category=&industry=&solution=&deployment_type=&methodology=&search=
 */
const public_list = async (req, res) => {
  try {
    const {
      page,
      limit,
      category,
      industry,
      solution,
      deployment_type,
      methodology,
      search,
      sort,
    } = req.query;
    const result = await CaseStudyRepository.publicList({
      page,
      limit,
      category,
      industry,
      solution,
      deployment_type,
      methodology,
      search,
      sort,
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
      message: "No Case Study Found",
    });
  }
};

const public_detail = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await CaseStudyRepository.findById(id);
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Case Study not found",
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
 * Opsi filter publik dari master data.
 */
const public_filters = async (req, res) => {
  try {
    const data = await CaseStudyRepository.filters();

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
    const data = await CaseStudyRepository.findById(id);
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Case Study not found",
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
    category,
    description,
    industries,
    solutions,
    deployment_type,
    timeline,
    compliance,
    methodology,
    team_size,
    testimonial,
    link,
  } = req.body;

  try {
    const data = await CaseStudyRepository.create({
      title,
      category: category || null,
      description,
      industries: industries || [],
      solutions: solutions || [],
      deployment_type: deployment_type || null,
      timeline: timeline ? parseInt(timeline, 10) : 0,
      compliance: compliance || null,
      methodology: methodology || null,
      team_size: normalizeTeamSize(team_size),
      testimonial: normalizeTestimonial(testimonial),
      link: link || null,
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
      message: "failed to create case study",
      info: error.message,
    });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    category,
    description,
    industries,
    solutions,
    deployment_type,
    timeline,
    compliance,
    methodology,
    team_size,
    testimonial,
    link,
  } = req.body;

  try {
    const existing = await CaseStudyRepository.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 404,
        message: "Case Study not found",
      });
    }

    const data = await CaseStudyRepository.update(id, {
      title: title ?? existing.title,
      category:
        category !== undefined ? category || null : existing.category,
      description: description ?? existing.description,
      industries: industries ?? existing.industries,
      solutions: solutions ?? existing.solutions,
      deployment_type:
        deployment_type !== undefined
          ? deployment_type || null
          : existing.deployment_type,
      timeline:
        timeline !== undefined
          ? parseInt(timeline, 10) || 0
          : existing.timeline,
      compliance:
        compliance !== undefined ? compliance || null : existing.compliance,
      methodology:
        methodology !== undefined ? methodology || null : existing.methodology,
      team_size:
        team_size !== undefined
          ? normalizeTeamSize(team_size)
          : existing.team_size,
      testimonial:
        testimonial !== undefined
          ? normalizeTestimonial(testimonial)
          : existing.testimonial,
      link: link !== undefined ? link || null : existing.link,
      updated_at: new Date(),
    });

    return res.status(200).json({
      status: 200,
      message: `successfully update case study ${id}`,
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "failed to update case study",
      info: error.message,
    });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;

  try {
    await CaseStudyRepository.remove(id);

    return res.status(200).json({
      status: 200,
      message: `successfully takedown case study ${id}`,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "case study not found",
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