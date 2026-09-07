/** @format */

// =========================================================================
// Excel Template & Parser utk Bulk Upload Schedule
// =========================================================================
// - Sheet "Template"  : kolom PROGRAM (dropdown dari MasterData),
//                       KATEGORI (readonly), START_DATE, END_DATE.
// - Sheet "MasterData": daftar program (title + kategori) utk referensi.
// Parser mengembalikan array baris mentah yg siap divalidasi controller.
// =========================================================================

const ExcelJS = require("exceljs");

const HEADERS = ["PROGRAM", "KATEGORI", "", "END_DATE"];

const MAX_ROWS = 500; // batas baris data agar aman

/** Bangun workbook template sesuai type master (COURSE / SKILL_ACCELERATOR). */
async function buildTemplateWorkbook(type, programs) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ExecuTrain CMS";
  workbook.created = new Date();

  const label = type === "COURSE" ? "Course Catalog" : "Skill Accelerator";

  // ---------- Sheet Template ----------
  const sheet = workbook.addWorksheet("Template", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "PROGRAM", key: "program", width: 52 },
    { header: "KATEGORI", key: "category", width: 24 },
    { header: "START DATE", key: "start", width: 16 },
    { header: "END DATE", key: "end", width: 16 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1F4E79" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Data validation: PROGRAM berupa dropdown yang merujuk sheet MasterData
  const listSheet = "MasterData";
  if (programs.length > 0) {
    const last = programs.length + 1; // header row 1
    const formula = `'${listSheet}'!$A$2:$A$${last}`;
    for (let r = 2; r <= MAX_ROWS + 1; r++) {
      const cell = sheet.getCell(`A${r}`);
      cell.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [formula],
        showErrorMessage: true,
        errorTitle: "Program tidak valid",
        error: "Pilih program dari daftar dropdown. Jangan ketik manual.",
      };
    }
  }

  // Data validation tanggal utk START & END
  for (let r = 2; r <= MAX_ROWS + 1; r++) {
    ["C", "D"].forEach((col) => {
      const cell = sheet.getCell(`${col}${r}`);
      cell.dataValidation = {
        type: "date",
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: "Tanggal tidak valid",
        error: "Isi tanggal valid. Saat mengetik gunakan format YYYY-MM-DD.",
      };
    });
  }

  // Gaya kolom kategori (readonly) contoh
  sheet.getCell("B2").value = "Pilih program dulu — terisi otomatis";
  sheet.getCell("B2").font = { italic: true, color: { argb: "A0A0A0" }, size: 10 };

  // ---------- Sheet MasterData ----------
  const md = workbook.addWorksheet(listSheet);
  md.columns = [
    { header: "PROGRAM (NAMA)", key: "title", width: 62 },
    { header: "KATEGORI", key: "category", width: 26 },
  ];

  const mdHeader = md.getRow(1);
  mdHeader.height = 20;
  mdHeader.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1F4E79" } };
  });

  programs.forEach((p, i) => {
    md.getCell(`A${i + 2}`).value = p.title;
    md.getCell(`B${i + 2}`).value = p.category || "";
  });

  // Catatan petunjuk (sheet Template)
  const notes = [
    "PETUNJUK PENGISIAN:",
    "1. Kolom PROGRAM: pilih dari dropdown (A2 dst).",
    "2. START DATE & END DATE: tulis sebagai teks YYYY-MM-DD, misal 2026-09-10.",
    "3. Satu baris = satu rentang tanggal (bisa 1 hari).",
    `4. Template utk: ${label}.`,
  ];
  notes.forEach((n, i) => {
    const cell = sheet.getCell(`G${i + 1}`);
    cell.value = n;
    cell.font = i === 0 ? { bold: true, color: { argb: "1F4E79" } } : { color: { argb: "606060" }, size: 10 };
  });

  return workbook;
}

/** Konversi nilai sel tanggal/number/string jadi teks YYYY-MM-DD ("" bila tak valid). */
function toDateText(value) {
  if (value == null) return "";
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(value).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : "";
}

/** Baca nilai sel Excel (unwrap formula / rich text / hyperlink). */
function cellText(value) {
  if (value == null) return "";
  let v = value;
  if (v && typeof v === "object") {
    if (v.result !== undefined) v = v.result;
    else if (v.richText) v = v.richText.map((t) => t.text).join("");
    else if (v.text !== undefined) v = v.text;
    else if (v.hyperlink) v = v.hyperlink;
  }
  return String(v == null ? "" : v).trim();
}

/**
 * Parse buffer workbook.xlsx -> baris mentah.
 * @returns {{ rows: Array, errors: Array }}
 * rows: [{ rowNum, program, category, start_date, end_date }]
 */
async function parseWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.getWorksheet("Template") || workbook.getWorksheet(1);
  if (!sheet) {
    return { rows: [], errors: [{ rowNum: 0, message: "Sheet 'Template' tidak ditemukan" }] };
  }

  const rows = [];
  const errors = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum < 2) return;

    const program = cellText(row.getCell(1).value);
    const category = cellText(row.getCell(2).value);
    const start_date = toDateText(row.getCell(3).value);
    const end_date = toDateText(row.getCell(4).value);

    if (!program && !category && !start_date && !end_date) return; // baris kosong

    const entry = { rowNum, program, category, start_date, end_date };

    if (!entry.program) errors.push({ rowNum, message: "PROGRAM kosong" });
    if (!entry.start_date)
      errors.push({ rowNum, message: "START DATE kosong / bukan format YYYY-MM-DD" });
    if (!entry.end_date)
      errors.push({ rowNum, message: "END DATE kosong / bukan format YYYY-MM-DD" });
    if (
      entry.start_date &&
      entry.end_date &&
      entry.start_date > entry.end_date
    ) {
      errors.push({ rowNum, message: "START DATE harus <= END DATE" });
    }

    rows.push(entry);
  });

  return { rows, errors };
}

module.exports = { buildTemplateWorkbook, parseWorkbook, HEADERS, MAX_ROWS };
