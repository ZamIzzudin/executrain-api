/** @format */

// =========================================================================
// ITProduct Controller v2 (PostgreSQL / Prisma)
// =========================================================================

const ITProductRepository = require("./repository");

/**
 * Normalisasi banner: string URL -> { url, public_id }.
 */
function normalizeBanner(banner, fallback = { url: "", public_id: "" }) {
  if (typeof banner === "string" && banner.trim() !== "") {
    return { url: banner, public_id: "" };
  }
  if (banner && typeof banner === "object") {
    return banner;
  }
  return fallback;
}

/**
 * Normalisasi highlight: pastikan array objek { image, title, description }.
 */
function normalizeHighlight(highlight) {
  if (!Array.isArray(highlight)) return [];
  return highlight
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
      ? await ITProductRepository.search(search)
      : await ITProductRepository.findAll();

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
      message: "No IT Product Found",
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
    const result = await ITProductRepository.publicList({
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
      message: "No IT Product Found",
    });
  }
};

const public_detail = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await ITProductRepository.findById(id);
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "IT Product not found",
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
 * Opsi filter publik: tech stack dari master data TECH_STACK.
 */
const public_filters = async (req, res) => {
  try {
    const data = await ITProductRepository.filters();

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
    const data = await ITProductRepository.findById(id);
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "IT Product not found",
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
    description,
    banner,
    tech_stack,
    link,
    problem,
    feature,
    compliance,
    highlight,
  } = req.body;

  try {
    const data = await ITProductRepository.create({
      title,
      description,
      banner: normalizeBanner(banner),
      tech_stack: tech_stack || [],
      link: link || null,
      problem: problem || null,
      feature: feature || [],
      compliance: compliance || null,
      highlight: normalizeHighlight(highlight),
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
      message: "failed to create IT product",
      info: error.message,
    });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    banner,
    tech_stack,
    link,
    problem,
    feature,
    compliance,
    highlight,
  } = req.body;

  try {
    const existing = await ITProductRepository.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 404,
        message: "IT Product not found",
      });
    }

    const data = await ITProductRepository.update(id, {
      title: title ?? existing.title,
      description: description ?? existing.description,
      banner: normalizeBanner(banner, existing.banner),
      tech_stack: tech_stack ?? existing.tech_stack,
      link: link !== undefined ? link || null : existing.link,
      problem: problem !== undefined ? problem || null : existing.problem,
      feature: feature ?? existing.feature,
      compliance:
        compliance !== undefined ? compliance || null : existing.compliance,
      highlight:
        highlight !== undefined
          ? normalizeHighlight(highlight)
          : existing.highlight,
      updated_at: new Date(),
    });

    return res.status(200).json({
      status: 200,
      message: `successfully update IT product ${id}`,
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "failed to update IT product",
      info: error.message,
    });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;

  try {
    await ITProductRepository.remove(id);

    return res.status(200).json({
      status: 200,
      message: `successfully takedown IT product ${id}`,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "IT product not found",
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