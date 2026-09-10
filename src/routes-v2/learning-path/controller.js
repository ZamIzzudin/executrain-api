/** @format */

// =========================================================================
// Learning Path Controller v2 (PostgreSQL / Prisma)
// =========================================================================

const LearningPathRepository = require("./repository");
const prisma = require("../../config/prisma");

const list = async (req, res) => {
  try {
    const { search } = req.query;
    const data = search
      ? await LearningPathRepository.search(search)
      : await LearningPathRepository.findAll();

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
      message: "No Learning Path Found",
    });
  }
};

/** Public list (hanya is_active) dengan course ter-resolve. */
const public_list = async (req, res) => {
  try {
    const { framework, category, search } = req.query;
    const data = await LearningPathRepository.findPublic({
      framework,
      category,
      search,
    });

    return res.status(200).json({
      status: 200,
      message: "success",
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "server error",
    });
  }
};

/** Public detail (is_active) dengan course ter-resolve. */
const public_detail = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await LearningPathRepository.findPublicDetail(id);
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Learning Path not found",
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

const detail = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await LearningPathRepository.findById(id);
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: "Learning Path not found",
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
 * Daftar course yang boleh dipilih utk sebuah learning path.
 * Course dicocokkan framework + category SAMA dengan path tsb.
 * Tanpa id → pilih course berdasarkan query framework & category.
 */
const course_options = async (req, res) => {
  try {
    const { id, framework, category, search } = req.query;

    let fw = framework;
    let cat = category;

    if (id) {
      const path = await LearningPathRepository.findById(id);
      if (!path) {
        return res.status(404).json({
          status: 404,
          message: "Learning Path not found",
        });
      }
      fw = path.framework;
      cat = path.category;
    }

    if (!fw || !cat) {
      return res.status(200).json({
        status: 200,
        message: "success",
        data: [],
      });
    }

    const where = {
      framework_type: fw,
      category: cat,
    };
    if (search) {
      where.OR = [{ title: { contains: search, mode: "insensitive" } }];
    }

    const data = await prisma.course.findMany({
      where,
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        framework_type: true,
        category: true,
        banner: true,
      },
    });

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
 * Opsi framework (scope) & category utk form Learning Path.
 * Framework = scope yang dipakai FRAMEWORK_ITEM. Category = item FRAMEWORK_ITEM.
 * Dgn query ?framework=xx → kembalikan category item utk scope tsb.
 */
const framework_options = async (req, res) => {
  try {
    const { framework } = req.query;

    const items = await prisma.masterData.findMany({
      where: { type: "FRAMEWORK_ITEM" },
      orderBy: [{ scope: "asc" }, { sort_order: "asc" }],
      select: { scope: true, value: true, label: true },
    });

    const byScope = {};
    for (const it of items) {
      const key = it.scope || "_";
      if (!byScope[key]) byScope[key] = [];
      byScope[key].push({ value: it.value, label: it.label || it.value });
    }

    const frameworks = Object.keys(byScope)
      .filter((s) => s !== "_")
      .map((s) => ({ value: s, label: s }));

    const categories = framework
      ? byScope[framework] || []
      : Object.keys(byScope)
          .filter((s) => s !== "_")
          .flatMap((s) =>
            byScope[s].map((c) => ({ ...c, framework: s })),
          );

    return res.status(200).json({
      status: 200,
      message: "success",
      data: {
        frameworks,
        categories,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

const create = async (req, res) => {
  const { title, description, banner, framework, category, stages } = req.body;

  try {
    if (!title || !framework || !category) {
      return res.status(400).json({
        status: 400,
        message: "title, framework, and category are required",
      });
    }

    const data = await LearningPathRepository.create({
      title,
      description: description || "",
      banner,
      framework,
      category,
      stages: stages || [],
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
      message: "failed to create learning path",
      info: error.message,
    });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { title, description, banner, framework, category, is_active, stages } =
    req.body;

  try {
    const existing = await LearningPathRepository.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 404,
        message: "Learning Path not found",
      });
    }

    const data = await LearningPathRepository.update(id, {
      title,
      description,
      banner,
      framework,
      category,
      is_active,
      stages,
    });

    return res.status(200).json({
      status: 200,
      message: `successfully update learning path ${id}`,
      data,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "failed to update learning path",
      info: error.message,
    });
  }
};

const remove = async (req, res) => {
  const { id } = req.params;

  try {
    await LearningPathRepository.remove(id);

    return res.status(200).json({
      status: 200,
      message: `successfully takedown learning path ${id}`,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "learning path not found",
    });
  }
};

module.exports = {
  list,
  public_list,
  detail,
  public_detail,
  course_options,
  framework_options,
  create,
  update,
  remove,
};
