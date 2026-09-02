/** @format */

// =========================================================================
// CaseStudy Repository (PostgreSQL / Prisma)
// =========================================================================

const prisma = require("../../config/prisma");

const CaseStudyRepository = {
  count() {
    return prisma.caseStudy.count();
  },

  findById(id) {
    return prisma.caseStudy.findUnique({
      where: { id },
    });
  },

  search(query) {
    return prisma.caseStudy.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { created_at: "desc" },
    });
  },

  findAll() {
    return prisma.caseStudy.findMany({
      orderBy: { created_at: "desc" },
    });
  },

  /**
   * Public paginated list dengan filter:
   * category, industry (has), solution (has), deployment_type,
   * methodology, search.
   */
  async publicList({
    page = 1,
    limit = 9,
    category,
    industry,
    solution,
    deployment_type,
    methodology,
    search,
    sort,
  }) {
    const take = Math.max(1, parseInt(limit, 10));
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * take;

    const where = {};
    if (category) where.category = category;
    if (industry) where.industries = { has: industry };
    if (solution) where.solutions = { has: solution };
    if (deployment_type) where.deployment_type = deployment_type;
    if (methodology) where.methodology = methodology;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy =
      sort === "oldest"
        ? { created_at: "asc" }
        : { created_at: "desc" };

    const [total, items] = await Promise.all([
      prisma.caseStudy.count({ where }),
      prisma.caseStudy.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
    ]);

    const total_pages = Math.max(1, Math.ceil(total / take));

    return {
      data: items,
      pagination: {
        current_page: Math.max(1, parseInt(page, 10)),
        total_pages,
        total_products: total,
        per_page: take,
        has_next: Math.max(1, parseInt(page, 10)) < total_pages,
        has_prev: Math.max(1, parseInt(page, 10)) > 1,
      },
    };
  },

  /**
   * Opsi filter publik dari master data:
   * CASE_CATEGORY, CASE_INDUSTRY, CASE_SOLUTION,
   * CASE_METHODOLOGY, CASE_DEPLOYMENT.
   */
  async filters() {
    const [categories, industries, solutions, methodologies, deployments] =
      await Promise.all([
        prisma.masterData.findMany({
          where: { type: "CASE_CATEGORY" },
          orderBy: { sort_order: "asc" },
          select: { value: true, label: true },
        }),
        prisma.masterData.findMany({
          where: { type: "CASE_INDUSTRY" },
          orderBy: { sort_order: "asc" },
          select: { value: true, label: true },
        }),
        prisma.masterData.findMany({
          where: { type: "CASE_SOLUTION" },
          orderBy: { sort_order: "asc" },
          select: { value: true, label: true },
        }),
        prisma.masterData.findMany({
          where: { type: "CASE_METHODOLOGY" },
          orderBy: { sort_order: "asc" },
          select: { value: true, label: true },
        }),
        prisma.masterData.findMany({
          where: { type: "CASE_DEPLOYMENT" },
          orderBy: { sort_order: "asc" },
          select: { value: true, label: true },
        }),
      ]);

    return {
      categories: categories.map((r) => ({ value: r.value, label: r.label })),
      industries: industries.map((r) => ({ value: r.value, label: r.label })),
      solutions: solutions.map((r) => ({ value: r.value, label: r.label })),
      methodologies: methodologies.map((r) => ({
        value: r.value,
        label: r.label,
      })),
      deployments: deployments.map((r) => ({ value: r.value, label: r.label })),
    };
  },

  create(data) {
    return prisma.caseStudy.create({
      data,
    });
  },

  update(id, data) {
    return prisma.caseStudy.update({
      where: { id },
      data,
    });
  },

  remove(id) {
    return prisma.caseStudy.delete({ where: { id } });
  },
};

module.exports = CaseStudyRepository;