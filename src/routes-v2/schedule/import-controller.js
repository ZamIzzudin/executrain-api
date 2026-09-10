/** @format */

// =========================================================================
// Schedule Import Controller — Bulk Upload Excel (CMS)
// =========================================================================
// Alur:
//  1) GET  /template?type=            -> unduh .xlsx (dropdown program + master)
//  2) POST /import/preview  (multipart)-> validasi file & kembalikan daftar
//                                        baris valid + baris error (belum simpan)
//  3) POST /import/confirm  (json)     -> simpan baris valid yang disetujui user
// =========================================================================

const ExcelJS = require("exceljs");
const fs = require("fs");
const prisma = require("../../config/prisma");
const ScheduleRepository = require("./repository");
const { buildTemplateWorkbook, parseWorkbook, MAX_ROWS } = require("./excel");
const { calendarDate, dayKey } = require("./date-utils");

const TYPE_LABEL = {
  COURSE: "Course",
  SKILL_ACCELERATOR: "Skill Accelerator",
};

/** Normalisasi entity type. */
const normalizeType = (v) => {
  const s = String(v || "").toUpperCase();
  return s === "COURSE" || s === "SKILL_ACCELERATOR" ? s : null;
};

/** Ambil semua program utk type tertentu. */
async function fetchPrograms(type) {
  const model = type === "COURSE" ? prisma.course : prisma.skillAccelerator;
  const rows = await model.findMany({
    select: { id: true, title: true, category: true },
    orderBy: { title: "asc" },
  });
  // Map title -> program (case-insensitive, duplikat title diabaikan)
  const map = new Map();
  rows.forEach((r) => {
    const key = String(r.title || "").trim().toLowerCase();
    if (key && !map.has(key)) map.set(key, r);
  });
  return { rows, map };
}

/**
 * GET /schedule/template?type=COURSE
 * Unduh template Excel (dropdown PROGRAM dari MasterData).
 */
const download_template = async (req, res) => {
  try {
    const type = normalizeType(req.query.type);
    if (!type) {
      return res
        .status(400)
        .json({ status: 400, message: "type is required (COURSE or SKILL_ACCELERATOR)" });
    }

    const { rows: programs } = await fetchPrograms(type);
    const workbook = await buildTemplateWorkbook(type, programs);
    const label = TYPE_LABEL[type].replace(/\s+/g, "_");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Schedule_Template_${label}.xlsx"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "failed to generate template", info: error.message });
  }
};

/** Ambil list baris (valid) dari file Excel upload. */
const read_uploaded = (req) => {
  if (!req.files || !req.files.file) {
    return { error: "File tidak ditemukan (field name harus 'file')" };
  }
  const file = req.files.file;
  if (!/\.(xlsx|xlsm)$/i.test(file.name)) {
    return { error: "Hanya file .xlsx yang didukung" };
  }
  return { file };
};

/** Baca buffer file (express-fileupload bisa simpan ke temp path). */
function fileBuffer(file) {
  if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
    return fs.readFileSync(file.tempFilePath);
  }
  return file.data;
}

/**
 * POST /schedule/import/preview
 * Body (multipart): file, type
 * Response: summary + valid_rows (dengan program & tanggal sudah dinormalisasi)
 *           + errors (baris yang gagal validasi) + duplicates terhadap DB.
 */
const import_preview = async (req, res) => {
  try {
    const { type } = req.body || {};
    const entityType = normalizeType(type);
    if (!entityType) {
      return res
        .status(400)
        .json({ status: 400, message: "type is required (COURSE or SKILL_ACCELERATOR)" });
    }

    const { file, error } = read_uploaded(req);
    if (error) return res.status(400).json({ status: 400, message: error });

    let parsed;
    try {
      parsed = await parseWorkbook(fileBuffer(file));
    } catch (e) {
      return res.status(400).json({
        status: 400,
        message: "File Excel tidak dapat dibaca / korup",
        info: e.message,
      });
    }

    const { rows, errors } = parsed;
    if (rows.length === 0 && errors.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Tidak ada data baris pada sheet Template",
      });
    }
    if (rows.length > MAX_ROWS) {
      return res.status(400).json({
        status: 400,
        message: `Maksimal ${MAX_ROWS} baris per file`,
      });
    }

    // Ambil master program utk validasi relasi
    const { map: programMap } = await fetchPrograms(entityType);

    // Baris valid: PROGRAM harus ada di master
    const valid_rows = [];
    const rowErrors = [...errors];
    const seenRow = new Set(errors.map((e) => e.rowNum));

    rows.forEach((r) => {
      // Lewati baris yang sudah error format dasar
      if (seenRow.has(r.rowNum)) return;

      const matched = programMap.get(String(r.program || "").trim().toLowerCase());
      if (!matched) {
        if (!seenRow.has(r.rowNum)) {
          rowErrors.push({
            rowNum: r.rowNum,
            message: `Program "${r.program}" tidak ditemukan di ${TYPE_LABEL[entityType]}`,
          });
          seenRow.add(r.rowNum);
        }
        return;
      }

      const start = calendarDate(r.start_date);
      const end = calendarDate(r.end_date);
      // expand jadi array per tanggal
      const dates = [];
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        dates.push(dayKey(d));
      }

      valid_rows.push({
        rowNum: r.rowNum,
        entity_type: entityType,
        entity_id: matched.id,
        program_name: matched.title,
        category: matched.category || "",
        program: matched.title,
        start_date: dayKey(start),
        end_date: dayKey(end),
        total_sessions: dates.length,
        dates,
      });
    });

    // Deteksi duplikat thd data yang sudah ada di DB (unique: entity+date)
    const duplicate_dates = [];
    if (valid_rows.length > 0) {
      const entityIds = [...new Set(valid_rows.map((v) => v.entity_id))];
      const allDates = [...new Set(valid_rows.flatMap((v) => v.dates))];
      const existing = await prisma.schedule.findMany({
        where: {
          entity_type: entityType,
          entity_id: { in: entityIds },
          schedule_date: { in: allDates.map((d) => calendarDate(d)) },
        },
        select: { entity_id: true, schedule_date: true },
      });
      existing.forEach((e) => {
        duplicate_dates.push({
          entity_id: e.entity_id,
          date: dayKey(e.schedule_date),
        });
      });
    }

    // Beri tahu per baris mana yang berisi tanggal duplikat
    const dupSet = new Set(duplicate_dates.map((d) => `${d.entity_id}|${d.date}`));
    const valid_rows_marked = valid_rows.map((v) => {
      const dupDates = v.dates.filter((d) => dupSet.has(`${v.entity_id}|${d}`));
      return { ...v, duplicate_dates: dupDates, has_duplicate: dupDates.length > 0 };
    });

    const totalSessions = valid_rows.reduce((n, v) => n + v.total_sessions, 0);
    const summary = {
      type: entityType,
      type_label: TYPE_LABEL[entityType],
      total_rows: valid_rows.length,
      total_errors: rowErrors.length,
      total_sessions: totalSessions,
      duplicate_sessions: duplicate_dates.length,
      new_sessions: totalSessions - duplicate_dates.length,
    };

    return res.status(200).json({
      status: 200,
      message: "success",
      data: {
        summary,
        rows: valid_rows_marked,
        errors: rowErrors,
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "failed to preview import", info: error.message });
  }
};

/**
 * POST /schedule/import/confirm
 * Body: { rows: valid_rows_marked (hanya yg disetujui user, tanpa field duplikat) }
 * Simpan per baris (createMany skipDuplicates) & kembalikan hasil.
 */
const import_confirm = async (req, res) => {
  try {
    const { rows } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ status: 400, message: "rows array is required" });
    }
    if (rows.length > MAX_ROWS) {
      return res.status(400).json({ status: 400, message: `Maksimal ${MAX_ROWS} baris` });
    }

    const entityType = normalizeType(rows[0].entity_type);
    if (!entityType) {
      return res.status(400).json({ status: 400, message: "invalid entity_type" });
    }

    // Ambil master utk validasi ulang relasi (hindari data tampered)
    const { map: programMap } = await fetchPrograms(entityType);

    const payload = [];
    const skipped_duplicate = [];
    let sessionsToInsert = 0;

    for (const row of rows) {
      // Validasi ulang program
      const key = String(row.program_name || row.program || "").trim().toLowerCase();
      const matched = programMap.get(key);
      if (!matched) {
        return res.status(400).json({
          status: 400,
          message: `Baris ${row.rowNum || "?"}: program "${row.program_name || row.program}" tidak valid`,
        });
      }

      const start = calendarDate(row.start_date);
      const end = calendarDate(row.end_date);
      if (!start || !end || start > end) {
        return res.status(400).json({
          status: 400,
          message: `Baris ${row.rowNum || "?"}: rentang tanggal tidak valid`,
        });
      }

      // expand per tanggal
      const dates = [];
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        dates.push(new Date(d));
      }

      dates.forEach((schedule_date) => {
        payload.push({
          entity_type: entityType,
          entity_id: matched.id,
          program_name: matched.title,
          schedule_date,
        });
        sessionsToInsert++;
      });
    }

    // Simpan — duplikat (entity+date sama) di-skip otomatis oleh unique index
    const result = await ScheduleRepository.createMany(payload, true);
    const inserted = result.count;

    // Kembalikan jumlah yg benar2 baru & duplikat yang dilewati
    return res.status(201).json({
      status: 201,
      message: "success",
      data: {
        total_sessions: sessionsToInsert,
        inserted,
        skipped_duplicates: Math.max(0, sessionsToInsert - inserted),
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "failed to save import", info: error.message });
  }
};

module.exports = {
  download_template,
  import_preview,
  import_confirm,
};
