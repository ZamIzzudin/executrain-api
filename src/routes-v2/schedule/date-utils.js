/** @format */

// =========================================================================
// Date Utils — semua penanggalan Schedule menggunakan UTC tengah malam
// supaya tanggal kalender tidak bergeser karena zona waktu server/client.
// =========================================================================

/** Parse `YYYY-MM-DD` (atau ISO/Date) menjadi Date UTC tengah malam. */
function calendarDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const mon = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (mon < 1 || mon > 12 || day < 1 || day > 31) return null;
  return new Date(Date.UTC(year, mon - 1, day));
}

/** Kunci tanggal kalender `YYYY-MM-DD` dari Date yang disimpan (UTC). */
function dayKey(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return "";
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
    dt.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Jarak hari antar dua tanggal (bisa negatif bila b < a). */
function diffDays(a, b) {
  const ka = calendarDate(a) || calendarDate(dayKey(a));
  const kb = calendarDate(b) || calendarDate(dayKey(b));
  if (!ka || !kb) return NaN;
  return Math.round((kb - ka) / 86400000);
}

/** Ekspansi rentang [start,end] menjadi array Date (UTC tengah malam). */
function expandRange(startDate, endDate) {
  const start = calendarDate(startDate);
  const end = calendarDate(endDate);
  if (!start || !end || start > end) return [];
  const out = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(new Date(d));
  }
  return out;
}

/** Parse YYYY-MM -> { start, end } batas UTC bulan penuh (atau null). */
function parseMonth(month) {
  const m = String(month || "").match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const mon = parseInt(m[2], 10);
  if (mon < 1 || mon > 12) return null;
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));
  return { start, end, year, month: mon };
}

module.exports = { calendarDate, dayKey, diffDays, expandRange, parseMonth };
