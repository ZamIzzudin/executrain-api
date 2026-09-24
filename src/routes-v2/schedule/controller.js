/** @format */

// =========================================================================
// Schedule Controller v2 (PostgreSQL / Prisma)
// =========================================================================
// Modul CMS untuk jadwal kelas (Course Catalog & Skill Accelerator).
// Satu baris = satu program pada satu tanggal. Tanggal disimpan sebagai
// UTC tengah malam (tidak terpengaruh zona waktu client).
// List dikembalikan per RANGE (klaster tanggal berurutan utk 1 program).
// =========================================================================

const ScheduleRepository = require("./repository");
const prisma = require("../../config/prisma");
const {
  calendarDate,
  dayKey,
  diffDays,
  expandRange,
  parseMonth,
} = require("./date-utils");

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Ambil data entity sumber (Course / SkillAccelerator) untuk mengisi
 * nama program & banner terkini (bila entity masih ada).
 */
async function enrichSchedules(schedules) {
  if (!schedules || schedules.length === 0) return schedules;

  const courseIds = new Set();
  const saIds = new Set();
  schedules.forEach((s) => {
    if (s.entity_type === "COURSE") courseIds.add(s.entity_id);
    else if (s.entity_type === "SKILL_ACCELERATOR") saIds.add(s.entity_id);
  });

  const [courses, skillAccelerators] = await Promise.all([
    courseIds.size > 0
      ? prisma.course.findMany({
          where: { id: { in: Array.from(courseIds) } },
          select: {
            id: true,
            title: true,
            category: true,
            banner: true,
            skill_level: true,
            duration: true,
          },
        })
      : Promise.resolve([]),
    saIds.size > 0
      ? prisma.skillAccelerator.findMany({
          where: { id: { in: Array.from(saIds) } },
          select: {
            id: true,
            title: true,
            category: true,
            banner: true,
            skill_level: true,
            duration: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const saMap = new Map(skillAccelerators.map((s) => [s.id, s]));

  return schedules.map((schedule) => {
    const source =
      schedule.entity_type === "COURSE"
        ? courseMap.get(schedule.entity_id)
        : saMap.get(schedule.entity_id);

    return {
      ...schedule,
      program_name: source?.title || schedule.program_name || "",
      category: source?.category || "",
      skill_level: source?.skill_level || "",
      duration: source?.duration ?? 0,
      banner: source?.banner || { url: "", public_id: "" },
    };
  });
}

function normalizeEntityType(v) {
  const up = String(v || "").toUpperCase();
  return up === "COURSE" || up === "SKILL_ACCELERATOR" ? up : null;
}

/**
 * Kelompokkan daftar schedule (sorted by entity lalu date asc) menjadi
 * item RENTANG: 1 program + tanggal berurutan (selisih 1 hari).
 */
function groupByRanges(sorted) {
  const ranges = [];
  let cur = null;

  const sameEntity = (a, b) =>
    a.entity_type === b.entity_type && a.entity_id === b.entity_id;

  for (const s of sorted) {
    if (
      cur &&
      sameEntity(cur[0], s) &&
      diffDays(cur[cur.length - 1].schedule_date, s.schedule_date) === 1
    ) {
      cur.push(s);
    } else {
      if (cur) ranges.push(cur);
      cur = [s];
    }
  }
  if (cur) ranges.push(cur);

  return ranges.map((group) => {
    const first = group[0];
    const last = group[group.length - 1];
    return {
      id: first.id,
      _id: first.id,
      entity_type: first.entity_type,
      entity_id: first.entity_id,
      program_name: first.program_name,
      start_date: first.schedule_date,
      end_date: last.schedule_date,
      session_dates: group.map((s) => s.schedule_date),
      session_ids: group.map((s) => s.id),
      session_count: group.length,
      category: first.category,
      banner: first.banner,
      is_active: first.is_active,
    };
  });
}

/**
 * Hari-hari dalam satu bulan -> rentang ringkas.
 * [10,11,12,15] -> "10-12, 15"
 */
function formatDayRanges(days) {
  if (!days || days.size === 0) return "";
  const sorted = Array.from(days).sort((a, b) => a - b);
  const parts = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const d = sorted[i];
    if (d === prev + 1) {
      prev = d;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = d;
    prev = d;
  }
  parts.push(start === prev ? `${start}` : `${start}-${prev}`);
  return parts.join(", ");
}

/** Validasi entity sumber (Course / SkillAccelerator) benar & ambil title. */
async function resolveEntity(entity_type, entity_id) {
  const type = normalizeEntityType(entity_type);
  if (!type) return { error: "entity_type must be COURSE or SKILL_ACCELERATOR" };
  if (!entity_id) return { error: "entity_id is required" };

  const model = type === "COURSE" ? prisma.course : prisma.skillAccelerator;
  const found = await model.findUnique({
    where: { id: entity_id },
    select: { id: true, title: true },
  });
  if (!found) return { error: `${type} with id ${entity_id} not found` };
  return { type, found };
}

// ── Admin CRUD ──────────────────────────────────────────────────────────

/** GET /schedule/list?month=YYYY-MM&entity_type= — daftar per RANGE. */
const list = async (req, res) => {
  try {
    const { month, entity_type } = req.query;
    const filter = {};

    const type = normalizeEntityType(entity_type);
    if (type) filter.entity_type = type;

    const range = month ? parseMonth(month) : null;
    if (month && !range) {
      return res
        .status(400)
        .json({ status: 400, message: "month must be in YYYY-MM format" });
    }

    if (!range) {
      // Tanpa filter bulan → ambil semua + grouping utuh.
      const schedules = await ScheduleRepository.findMany({
        filter,
        sort: [{ entity_type: "asc" }, { entity_id: "asc" }, { schedule_date: "asc" }],
      });
      const enriched = await enrichSchedules(schedules);
      return res.status(200).json({
        status: 200,
        message: "success",
        data: groupByRanges(enriched),
        total_sessions: enriched.length,
        filters: { month: month || null, entity_type: type },
      });
    }

    // Ambil kandidat schedule dalam bulan (tanpa padding) hanya untuk
    // mengetahui entity mana yang aktif di bulan ini.
    const candidate = await prisma.schedule.findMany({
      where: {
        ...filter,
        schedule_date: { gte: range.start, lte: range.end },
      },
      select: { entity_type: true, entity_id: true },
      distinct: ["entity_type", "entity_id"],
    });

    // Muat SELURUH baris dari setiap entity tsb (tanpa batas tanggal) supaya
    // grouping range yang melintasi batas bulan (mis. 30 Sep - 3 Okt) tetap
    // terkelompok utuh dan tidak terpotong pada padding.
    const fullRows = await ScheduleRepository.findMany({
      filter: {
        ...filter,
        OR: candidate.map((c) => ({
          entity_type: c.entity_type,
          entity_id: c.entity_id,
        })),
      },
      sort: [{ entity_type: "asc" }, { entity_id: "asc" }, { schedule_date: "asc" }],
    });

    const enriched = await enrichSchedules(fullRows);
    const allRanges = groupByRanges(enriched);

    // Hanya tampilkan range yang intersect bulan ini (setidaknya 1 tanggal di bulan tsb).
    const ranges = allRanges.filter((r) =>
      r.session_dates.some((d) => {
        const k = dayKey(d);
        return k >= dayKey(range.start) && k <= dayKey(range.end);
      }),
    );

    return res.status(200).json({
      status: 200,
      message: "success",
      data: ranges,
      total_sessions: enriched.length,
      filters: { month: month || null, entity_type: type },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

/**
 * GET /schedule/calendar?year=&month= — data per bulan siap render
 * (dipakai tampilan list per bulan di CMS). Bulan wajib.
 */
const calendar_list = async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res
        .status(400)
        .json({ status: 400, message: "year and month are required" });
    }
    const range = parseMonth(`${year}-${month}`);
    if (!range) {
      return res
        .status(400)
        .json({ status: 400, message: "invalid year/month" });
    }

    const schedules = await ScheduleRepository.findMany({
      filter: { schedule_date: { gte: range.start, lte: range.end } },
      sort: { schedule_date: "asc" },
    });

    const enriched = await enrichSchedules(schedules);

    return res.status(200).json({
      status: 200,
      message: "success",
      data: enriched,
      meta: { year: range.year, month: range.month },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

/** GET /schedule/options?type=COURSE|SKILL_ACCELERATOR — opsi dropdown program. */
const options = async (req, res) => {
  try {
    const { type } = req.query;
    const t = normalizeEntityType(type);
    if (!t) {
      return res
        .status(400)
        .json({ status: 400, message: "type is required (COURSE or SKILL_ACCELERATOR)" });
    }

    const model = t === "COURSE" ? prisma.course : prisma.skillAccelerator;
    const rows = await model.findMany({
      select: { id: true, title: true, category: true },
      orderBy: { title: "asc" },
    });

    const categories = [...new Set(rows.map((r) => r.category).filter(Boolean))].sort();

    return res.status(200).json({
      status: 200,
      message: "success",
      data: rows,
      meta: { type: t, categories },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

/** GET /schedule/detail/:id — baris + `group` (rentang tanggal utk program sama). */
const detail = async (req, res) => {
  const { id } = req.params;
  try {
    const schedule = await ScheduleRepository.findByIdFull(id);
    if (!schedule) {
      return res.status(404).json({ status: 404, message: "Schedule not found" });
    }

    // Semua schedule utk entity ini (untuk deteksi klaster tanggal berurutan)
    const siblings = await ScheduleRepository.findMany({
      filter: {
        entity_type: schedule.entity_type,
        entity_id: schedule.entity_id,
      },
      sort: { schedule_date: "asc" },
    });

    const enrichedAll = await enrichSchedules(siblings);
    const ranges = groupByRanges(enrichedAll);
    const group = ranges.find((r) => r.session_ids.includes(id)) || null;

    return res.status(200).json({
      status: 200,
      message: "success",
      data: {
        ...schedule,
        program_name: group?.program_name || schedule.program_name || "",
        category: group?.category || "",
        banner: group?.banner || { url: "", public_id: "" },
        group: group
          ? {
              start_date: group.start_date,
              end_date: group.end_date,
              dates: group.session_dates,
              ids: group.session_ids,
            }
          : {
              start_date: schedule.schedule_date,
              end_date: schedule.schedule_date,
              dates: [schedule.schedule_date],
              ids: [schedule.id],
            },
        // seluruh rentang lain utk program ini (berdekatan terpisah)
        other_groups: (ranges || [])
          .filter((r) => !r.session_ids.includes(id))
          .map((r) => ({
            start_date: r.start_date,
            end_date: r.end_date,
            dates: r.session_dates,
            ids: r.session_ids,
          })),
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

/** POST /schedule/add — satu tanggal (ISO/YYYY-MM-DD diterima). */
const add = async (req, res) => {
  try {
    const { entity_type, entity_id, schedule_date } = req.body;

    const resolved = await resolveEntity(entity_type, entity_id);
    if (resolved.error) {
      return res.status(400).json({ status: 400, message: resolved.error });
    }

    const day = calendarDate(schedule_date);
    if (!day) {
      return res
        .status(400)
        .json({ status: 400, message: "schedule_date is required (YYYY-MM-DD)" });
    }

    const data = await ScheduleRepository.create({
      entity_type: resolved.type,
      entity_id: resolved.found.id,
      program_name: resolved.found.title || "",
      schedule_date: day,
    });

    return res.status(201).json({ status: 201, message: "success", data });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ status: 400, message: "failed to create schedule", info: error.message });
  }
};

/** POST /schedule/range — buat banyak baris dari rentang [start,end] (simpan per tanggal). */
const add_range = async (req, res) => {
  try {
    const { entity_type, entity_id, start_date, end_date } = req.body;

    const resolved = await resolveEntity(entity_type, entity_id);
    if (resolved.error) {
      return res.status(400).json({ status: 400, message: resolved.error });
    }

    const dates = expandRange(start_date, end_date);
    if (dates.length === 0) {
      return res
        .status(400)
        .json({ status: 400, message: "start_date and end_date are required (end >= start)" });
    }

    const payload = dates.map((d) => ({
      entity_type: resolved.type,
      entity_id: resolved.found.id,
      program_name: resolved.found.title || "",
      schedule_date: d,
    }));

    const created = await ScheduleRepository.createMany(payload, true);

    return res.status(201).json({
      status: 201,
      message: "success",
      data: created,
      dates: dates.length,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ status: 400, message: "failed to create schedule range", info: error.message });
  }
};

/** POST /schedule/add-bulk — array data (untuk nanti bulk upload). */
const add_bulk = async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res
        .status(400)
        .json({ status: 400, message: "data array is required" });
    }

    const payloads = [];
    for (const item of data) {
      const resolved = await resolveEntity(item.entity_type, item.entity_id);
      if (resolved.error) {
        return res.status(400).json({ status: 400, message: resolved.error });
      }
      const day = calendarDate(item.schedule_date);
      if (!day) {
        return res
          .status(400)
          .json({ status: 400, message: "schedule_date is required for every item (YYYY-MM-DD)" });
      }
      payloads.push({
        entity_type: resolved.type,
        entity_id: resolved.found.id,
        program_name: resolved.found.title || "",
        schedule_date: day,
      });
    }

    await ScheduleRepository.createMany(payloads, true);
    const inserted = await ScheduleRepository.findMany({
      filter: {
        created_at: { gte: new Date(Date.now() - 1000 * 60) },
      },
      sort: { created_at: "desc" },
      take: payloads.length,
    });

    return res.status(201).json({
      status: 201,
      message: "success",
      data: inserted,
      total: payloads.length,
    });
  } catch (error) {
    console.log(error.message);
    return res
      .status(400)
      .json({ status: 400, message: "failed to bulk create schedule", info: error.message });
  }
};

/** PUT /schedule/adjust-range/:id — ganti seluruh rentang program ini. */
const adjust_range = async (req, res) => {
  const { id } = req.params;
  try {
    const { entity_type, entity_id, start_date, end_date, replace_ids } = req.body;

    const current = await ScheduleRepository.findById(id);
    if (!current) {
      return res.status(404).json({ status: 404, message: "Schedule not found" });
    }

    // Target entity: gunakan dari body bila berubah, else ikut baris awal.
    const resolved = await resolveEntity(
      entity_type || current.entity_type,
      entity_id || current.entity_id,
    );
    if (resolved.error) {
      return res.status(400).json({ status: 400, message: resolved.error });
    }

    const dates = expandRange(start_date, end_date);
    if (dates.length === 0) {
      return res
        .status(400)
        .json({ status: 400, message: "start_date and end_date are required (end >= start)" });
    }

    // Baris lama dicabut (termasuk baris utama) supaya unique constraint aman.
    const toRemove = Array.from(new Set([id, ...(replace_ids || [])]));
    if (toRemove.length > 0) {
      await ScheduleRepository.removeMany(toRemove);
    }

    const payload = dates.map((d) => ({
      entity_type: resolved.type,
      entity_id: resolved.found.id,
      program_name: resolved.found.title || "",
      schedule_date: d,
    }));

    const created = await ScheduleRepository.createMany(payload, true);

    return res.status(200).json({
      status: 200,
      message: "success",
      data: created,
      dates: dates.length,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ status: 400, message: "failed to update schedule range", info: error.message });
  }
};

/** PUT /schedule/adjust/:id — update satu baris. */
const adjust = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await ScheduleRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ status: 404, message: "Schedule not found" });
    }

    const { entity_type, entity_id, schedule_date, is_active } = req.body;

    let finalEntityType = existing.entity_type;
    let finalEntityId = existing.entity_id;

    if (entity_type || entity_id) {
      const resolved = await resolveEntity(
        entity_type || existing.entity_type,
        entity_id || existing.entity_id,
      );
      if (resolved.error) {
        return res.status(400).json({ status: 400, message: resolved.error });
      }
      finalEntityType = resolved.type;
      finalEntityId = resolved.found.id;
    }

    const newDay = calendarDate(schedule_date);
    const finalDate = newDay || existing.schedule_date;

    const data = await ScheduleRepository.update(id, {
      entity_type: finalEntityType,
      entity_id: finalEntityId,
      program_name: "",
      schedule_date: finalDate,
      is_active: is_active !== undefined ? Boolean(is_active) : existing.is_active,
      updated_at: new Date(),
    });

    return res.status(200).json({ status: 200, message: "success", data });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ status: 400, message: "failed to update schedule", info: error.message });
  }
};

/** DELETE /schedule/takedown/:id */
const takedown = async (req, res) => {
  const { id } = req.params;
  try {
    await ScheduleRepository.remove(id);
    return res
      .status(200)
      .json({ status: 200, message: `successfully takedown schedule ${id}` });
  } catch (error) {
    console.log(error.message);
    return res
      .status(400)
      .json({ status: 400, message: "schedule not found" });
  }
};

/** DELETE /schedule/takedown-many — body { ids: [] } hapus banyak sekaligus. */
const takedown_many = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ status: 400, message: "ids array is required" });
    }
    const result = await ScheduleRepository.removeMany(ids);
    return res.status(200).json({
      status: 200,
      message: "success",
      data: { deleted: result.count },
    });
  } catch (error) {
    console.log(error.message);
    return res
      .status(400)
      .json({ status: 400, message: "failed to delete schedules", info: error.message });
  }
};

/** GET /schedule/public/:type/:entityId — endpoint publik (tanpa login).
 * Mengembalikan tanggal aktif utk 1 course / skill accelerator.
 * type: COURSE | SKILL_ACCELERATOR
 * query optional: from=YYYY-MM-DD, to=YYYY-MM-DD (default mulai hari ini, 12 bln).
 */
const public_dates = async (req, res) => {
  try {
    const { type, entityId } = req.params;
    const entityType = normalizeEntityType(type);
    if (!entityType || !entityId) {
      return res.status(400).json({
        status: 400,
        message: "path harus `COURSE/:entityId` atau `SKILL_ACCELERATOR/:entityId`",
      });
    }

    // Verifikasi entity induk benar-benar ada (hindari bocor data random)
    const model = entityType === "COURSE" ? prisma.course : prisma.skillAccelerator;
    const parent = await model.findUnique({
      where: { id: entityId },
      select: { id: true, title: true, category: true },
    });
    if (!parent) {
      return res.status(404).json({ status: 404, message: `${entityType} not found` });
    }

    const now = new Date();
    const today = calendarDate(dayKey(now));
    const from = calendarDate(req.query.from) || today;
    const to =
      calendarDate(req.query.to) ||
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 12, now.getUTCDate()));
    if (from && to && from > to) {
      return res.status(400).json({ status: 400, message: "from must be <= to" });
    }

    const schedules = await ScheduleRepository.findMany({
      filter: {
        entity_type: entityType,
        entity_id: entityId,
        is_active: true,
        schedule_date: { gte: from, lte: to },
      },
      sort: [{ schedule_date: "asc" }],
    });

    const dates = schedules.map((s) => dayKey(s.schedule_date));
    const ranges = groupByRanges(schedules).map((r) => ({
      start_date: dayKey(r.start_date),
      end_date: dayKey(r.end_date),
      sessions: r.session_count,
    }));

    return res.status(200).json({
      status: 200,
      message: "success",
      data: {
        entity_type: entityType,
        entity_id: entityId,
        program_name: parent.title,
        category: parent.category,
        schedule_dates: dates,
        ranges,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error", info: error.message });
  }
};

/**
 * GET /schedule/public/list — daftar PROGRAM berjadwal utk halaman Schedule compro.
 * Query opsional: from, to (YYYY-MM-DD), category, type (COURSE|SKILL_ACCELERATOR),
 * search, page, limit. Default from = hari ini, to = +12 bulan.
 * Satu item = satu program (Course / Skill Accelerator) berisi rentang tanggalnya.
 * Pagination dihitung per PROGRAM, bukan per baris schedule.
 */
const public_list = async (req, res) => {
  try {
    const type = normalizeEntityType(req.query.type);
    const category = String(req.query.category || "").trim();
    const search = String(req.query.search || "").trim().toLowerCase();

    const now = new Date();
    const today = calendarDate(dayKey(now));
    const from = calendarDate(req.query.from) || today;
    const to =
      calendarDate(req.query.to) ||
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 12, now.getUTCDate()));
    if (from > to) {
      return res.status(400).json({ status: 400, message: "from must be <= to" });
    }

    const filter = { is_active: true, schedule_date: { gte: from, lte: to } };
    if (type) filter.entity_type = type;

    // Ambil semua baris dalam range (dataset kecil), enrich nama/banner,
    // lalu filter kategori & search sebelum digroup per program.
    const schedules = await ScheduleRepository.findMany({
      filter,
      sort: [
        { entity_type: "asc" },
        { entity_id: "asc" },
        { schedule_date: "asc" },
      ],
    });
    let enriched = await enrichSchedules(schedules);

    // Opsi kategori diambil dari SELURUH program berjadwal (sebelum filter
    // kategori/search) supaya pilihan di dropdown tetap lengkap/stabil.
    const catSet = new Set();
    for (const s of enriched) {
      if (s.category) catSet.add(s.category);
    }
    const catValues = Array.from(catSet).sort();
    const md =
      catValues.length > 0
        ? await prisma.masterData.findMany({
            where: { value: { in: catValues } },
            select: { value: true, label: true },
          })
        : [];
    const labelMap = new Map(md.map((m) => [m.value, m.label || m.value]));

    if (category) enriched = enriched.filter((s) => s.category === category);
    if (search) {
      enriched = enriched.filter(
        (s) =>
          (s.program_name || "").toLowerCase().includes(search) ||
          (s.category || "").toLowerCase().includes(search),
      );
    }

    // Group per program (entity_type + entity_id)
    const byProgram = new Map();
    for (const s of enriched) {
      const key = `${s.entity_type}:${s.entity_id}`;
      if (!byProgram.has(key)) {
        byProgram.set(key, {
          entity_type: s.entity_type,
          entity_id: s.entity_id,
          program_name: s.program_name,
          category: s.category,
          skill_level: s.skill_level || "",
          duration: s.duration ?? 0,
          banner: s.banner,
          rows: [],
        });
      }
      byProgram.get(key).rows.push(s);
    }

    // Opsi kategori = kategori unik dari SEMUA program berjadwal (bukan per halaman)
    const year = now.getUTCFullYear();

    // Aktivitas per bulan (Jan–Des tahun berjalan) dihitung dari SELURUH jadwal
    // aktif program tsb pada tahun berjalan, bukan hanya window from/to.
    const programKeys = Array.from(byProgram.values()).map((p) => ({
      entity_type: p.entity_type,
      entity_id: p.entity_id,
    }));
    const yearRows = await ScheduleRepository.findMany({
      filter: {
        is_active: true,
        schedule_date: {
          gte: calendarDate(`${year}-01-01`),
          lte: calendarDate(`${year}-12-31`),
        },
        ...(programKeys.length > 0
          ? {
              OR: programKeys.map((k) => ({
                entity_type: k.entity_type,
                entity_id: k.entity_id,
              })),
            }
          : {}),
      },
      sort: [{ schedule_date: "asc" }],
    });
    // Hari per bulan per program → diformat jadi rentang tanggal ("10-15").
    const monthDays = new Map();
    for (const row of yearRows) {
      const key = `${row.entity_type}:${row.entity_id}`;
      const k = dayKey(row.schedule_date);
      const month = Number(k.slice(5, 7)) - 1;
      const day = Number(k.slice(8, 10));
      if (month < 0 || month > 11 || !day) continue;
      const arr =
        monthDays.get(key) || Array.from({ length: 12 }, () => new Set());
      arr[month].add(day);
      monthDays.set(key, arr);
    }

    const programs = Array.from(byProgram.values())
      .map((p) => {
        const ranges = groupByRanges(p.rows).map((r) => ({
          start_date: dayKey(r.start_date),
          end_date: dayKey(r.end_date),
          sessions: r.session_count,
        }));

        return {
          entity_type: p.entity_type,
          entity_id: p.entity_id,
          program_name: p.program_name,
          category: p.category,
          category_label: labelMap.get(p.category) || p.category,
          skill_level: p.skill_level,
          duration: p.duration,
          banner: p.banner,
          next_date: ranges.length > 0 ? ranges[0].start_date : null,
          dates: p.rows.map((r) => dayKey(r.schedule_date)).sort(),
          ranges,
          total_sessions: p.rows.length,
          year,
          monthly_ranges: (
            monthDays.get(`${p.entity_type}:${p.entity_id}`) ||
            Array.from({ length: 12 }, () => new Set())
          ).map(formatDayRanges),
        };
      })
      .sort((a, b) => String(a.next_date || "").localeCompare(String(b.next_date || "")));

    // Pagination per program
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 9));
    const total = programs.length;
    const total_pages = Math.max(1, Math.ceil(total / limit));
    const current_page = Math.min(page, total_pages);
    const data = programs.slice(
      (current_page - 1) * limit,
      current_page * limit,
    );

    return res.status(200).json({
      status: 200,
      message: "success",
      data,
      pagination: {
        current_page,
        total_pages,
        total_products: total,
        per_page: limit,
        has_next: current_page < total_pages,
        has_prev: current_page > 1,
      },
      filters: {
        categories: catValues.map((v) => ({
          value: v,
          label: labelMap.get(v) || v,
        })),
        types: [
          { value: "COURSE", label: "Course" },
          { value: "SKILL_ACCELERATOR", label: "Skill Accelerator" },
        ],
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error", info: error.message });
  }
};

module.exports = {
  list,
  calendar_list,
  options,
  detail,
  public_dates,
  public_list,
  add,
  add_bulk,
  add_range,
  adjust,
  adjust_range,
  takedown,
  takedown_many,
};
