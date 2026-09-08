/** @format */

// =========================================================================
// Learning Path Repository v2 (PostgreSQL / Prisma)
// =========================================================================

const prisma = require("../../config/prisma");

const stageSelect = {
  id: true,
  learning_path_id: true,
  name: true,
  description: true,
  course_ids: true,
  course_links: true,
  sort_order: true,
  created_at: true,
  updated_at: true,
};

const pathSelect = {
  id: true,
  title: true,
  description: true,
  banner: true,
  framework: true,
  category: true,
  is_active: true,
  created_at: true,
  updated_at: true,
};

/** Serialisasi objek yang mungkin Prisma kembalikan ke bentuk dangkal. */
function plain(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Normalisasi `course_links` dari berbagai bentuk input ke array objek.
 * Format: [{ course_id, follows_course_id }].
 */
function normalizeLinks(links) {
  if (Array.isArray(links)) return links.filter(Boolean);
  if (links && typeof links === "object") return [links];
  if (typeof links === "string") {
    try {
      const parsed = JSON.parse(links);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

/**
 * Resolve course_ids tiap stage menjadi objek course utk konsumsi publik.
 *
 * `course_links` tiap stage: [{ course_id, follows_course_id }] — course di
 * stage ini yang merupakan lanjutan dari course pendahulu (di stage lebih
 * awal). Dari rantai tsb, tiap course yang saling terhubung diberi family_id
 * yang sama (akar rantai) sehingga UI bisa menyorot satu keluarga saat hover.
 */
async function attachCourses(paths) {
  const list = Array.isArray(paths) ? paths : [paths];
  if (list.length === 0) return list;

  const allIds = [
    ...new Set(
      list.flatMap((p) => {
        const fromStages = (p.stages || []).flatMap((s) =>
          Array.isArray(s.course_ids) ? s.course_ids : [],
        );
        const fromLinks = (p.stages || []).flatMap((s) =>
          normalizeLinks(s.course_links).flatMap((l) => [
            l.course_id,
            l.follows_course_id,
          ]),
        );
        return [...fromStages, ...fromLinks];
      }),
    ),
  ];

  const coursesById = new Map();
  if (allIds.length > 0) {
    try {
      const courses = await prisma.course.findMany({
        where: { id: { in: allIds } },
      });
      for (const c of courses) coursesById.set(c.id, c);
    } catch (e) {
      console.log(e.message);
    }
  }

  const attach = (p) => {
    const stages = (p.stages || [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    // Kumpulkan semua relasi continuation dlm path ini (course -> pendahulu).
    const parentMap = new Map();
    for (const s of stages) {
      for (const l of normalizeLinks(s.course_links)) {
        if (l.course_id && l.follows_course_id) {
          parentMap.set(l.course_id, l.follows_course_id);
        }
      }
    }

    // Akar rantai (course tanpa pendahulu) dipakai sbg family id.
    const rootOf = (cid) => {
      let cur = cid;
      const seen = new Set();
      while (parentMap.has(cur) && !seen.has(cur)) {
        seen.add(cur);
        cur = parentMap.get(cur);
      }
      return cur;
    };

    return {
      ...p,
      stages: stages.map((s) => {
        const links = normalizeLinks(s.course_links);
        const linkByCourse = new Map(
          links.filter((l) => l.course_id).map((l) => [l.course_id, l]),
        );

        return {
          ...s,
          course_links: links,
          courses: (Array.isArray(s.course_ids) ? s.course_ids : [])
            .map((cid) => coursesById.get(cid))
            .filter(Boolean)
            .map((c) => {
              const base = {
                id: c.id,
                title: c.title,
                code: c.code,
                description: c.description,
                banner: c.banner,
                framework_type: c.framework_type,
                category: c.category,
              };

              const link = linkByCourse.get(c.id);
              const follows = link?.follows_course_id
                ? coursesById.get(link.follows_course_id)
                : null;
              if (follows) {
                base.continuation_course_id = follows.id;
                base.continuation_title = follows.title;
              }

              // Family = akar rantai; course yang terhubung (atau menjadi
              // pendahulu course lain) mendapat family id yang sama.
              const isLinked = parentMap.has(c.id);
              const isParentOfLinked = [...parentMap.values()].includes(c.id);
              if (isLinked || isParentOfLinked) {
                base.family_id = `follows-${rootOf(c.id)}`;
              }

              return base;
            }),
        };
      }),
    };
  };

  const out = list.map(attach);
  return Array.isArray(paths) ? out : out[0];
}

const LearningPathRepository = {
  findAll() {
    return prisma.learningPath
      .findMany({
        select: {
          ...pathSelect,
          stages: { select: stageSelect, orderBy: { sort_order: "asc" } },
        },
        orderBy: { created_at: "desc" },
      })
      .then((rows) => rows.map(plain));
  },

  search(search) {
    return prisma.learningPath
      .findMany({
        where: {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
        select: {
          ...pathSelect,
          stages: { select: stageSelect, orderBy: { sort_order: "asc" } },
        },
        orderBy: { created_at: "desc" },
      })
      .then((rows) => rows.map(plain));
  },

  findById(id) {
    return prisma.learningPath
      .findUnique({
        where: { id },
        select: {
          ...pathSelect,
          stages: { select: stageSelect, orderBy: { sort_order: "asc" } },
        },
      })
      .then((row) => (row ? plain(row) : null));
  },

  /**
   * Public list learning path (hanya aktif) + course ter-resolve tiap stage.
   */
  async findPublic({ framework, category, search }) {
    const where = { is_active: true };
    if (framework) where.framework = framework;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.learningPath
      .findMany({
        where,
        select: {
          ...pathSelect,
          stages: { select: stageSelect, orderBy: { sort_order: "asc" } },
        },
        orderBy: { created_at: "desc" },
      })
      .then((r) => r.map(plain));

    return attachCourses(rows);
  },

  async findPublicDetail(id) {
    const row = await prisma.learningPath
      .findFirst({
        where: { id, is_active: true },
        select: {
          ...pathSelect,
          stages: { select: stageSelect, orderBy: { sort_order: "asc" } },
        },
      })
      .then((r) => (r ? plain(r) : null));
    if (!row) return null;
    const [withCourses] = await attachCourses([row]);
    return withCourses;
  },

  async create({ title, description, banner, framework, category, stages }) {
    const pathId = await prisma.$transaction(async (tx) => {
      const normalizedBanner =
        typeof banner === "string" && banner.trim()
          ? { url: banner, public_id: "" }
          : banner && typeof banner === "object"
            ? banner
            : { url: "", public_id: "" };

      const path = await tx.learningPath.create({
        data: {
          title,
          description: description || "",
          banner: normalizedBanner,
          framework,
          category,
        },
      });

      if (Array.isArray(stages) && stages.length > 0) {
        await tx.learningPathStage.createMany({
          data: stages.map((s, i) => ({
            learning_path_id: path.id,
            name: s.name,
            description: s.description || "",
            course_ids: Array.isArray(s.course_ids) ? s.course_ids : [],
            course_links: normalizeLinks(s.course_links),
            sort_order: s.sort_order ?? i,
          })),
        });
      }

      return path.id;
    });

    return LearningPathRepository.findById(pathId);
  },

  /**
   * Update learning path + ganti seluruh stages (delete all + recreate).
   */
  async update(
    id,
    {
      title,
      description,
      banner,
      framework,
      category,
      is_active,
      stages,
    },
  ) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.learningPath.findUnique({ where: { id } });
      if (!existing) return null;

      let normalizedBanner =
        banner && typeof banner === "object" ? banner : existing.banner;
      if (typeof banner === "string" && banner.trim() !== "") {
        normalizedBanner = { url: banner, public_id: "" };
      }

      await tx.learningPath.update({
        where: { id },
        data: {
          title: title !== undefined ? title : existing.title,
          description:
            description !== undefined ? description : existing.description,
          banner: normalizedBanner,
          framework: framework !== undefined ? framework : existing.framework,
          category: category !== undefined ? category : existing.category,
          is_active:
            is_active !== undefined ? is_active : existing.is_active,
          updated_at: new Date(),
        },
      });

      await tx.learningPathStage.deleteMany({
        where: { learning_path_id: id },
      });
      if (Array.isArray(stages) && stages.length > 0) {
        await tx.learningPathStage.createMany({
          data: stages.map((s, i) => ({
            learning_path_id: id,
            name: s.name,
            description: s.description || "",
            course_ids: Array.isArray(s.course_ids) ? s.course_ids : [],
            course_links: normalizeLinks(s.course_links),
            sort_order: s.sort_order ?? i,
          })),
        });
      }
    });

    return LearningPathRepository.findById(id);
  },

  remove(id) {
    return prisma.learningPath.delete({ where: { id } });
  },
};

module.exports = LearningPathRepository;
