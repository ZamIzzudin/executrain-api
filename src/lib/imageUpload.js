/** @format */

// =========================================================================
// Image Upload + Compression Helper
// =========================================================================
// Alur:
//   1. Validasi bahwa file adalah gambar (jpeg/png/webp).
//   2. Validasi ukuran file original maksimal 2MB.
//   3. Kompres gambar dengan sharp (resize & quality) sehingga lebih kecil.
//   4. Simpan hasil kompres ke temp file.
//   5. Upload temp file ke CDN (Azure Blob, via lib/cd).
// =========================================================================

const fs = require("fs");
const path = require("path");
const os = require("os");
const sharp = require("sharp");
const { upload } = require("./cd");

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_WIDTH = 1600; // Lebar maksimal gambar setelah resize (persegi/panorama)
const COMPRESS_QUALITY = 80;
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"];

/**
 * Kompres buffer gambar (sharp) ke jpeg/webp berkualitas 80 & resize bila besar.
 * @param {Buffer} buffer
 * @returns {Promise<Buffer>} buffer terkompres
 */
async function compressBuffer(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();

    let pipeline = sharp(buffer).rotate(); // fix EXIF orientation
    const isPng = metadata.format === "png";
    const ext = isPng ? "png" : "webp";
    const quality = isPng ? 6 : COMPRESS_QUALITY; // png pakai pngquant level

    if (metadata.width && metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }

    if (isPng) {
      const out = await pipeline
        .png({ quality, compressionLevel: 9, palette: true })
        .toBuffer();
      return out;
    }
    return await pipeline.webp({ quality }).toBuffer();
  } catch (error) {
    // Fallback: jika gagal kompres, kembalikan buffer semula
    console.error("Compress error (fallback to original):", error.message);
    return buffer;
  }
}

/**
 * Upload gambar dengan kompresi & batas ukuran 2MB.
 * @param {Object} file - File (express-fileupload) berisi .data atau .tempFilePath
 * @param {Object} options - { folder }
 * @returns {Promise<{url: string, public_id: string}>}
 */
async function uploadCompressedImage(file, options = {}) {
  // 1. Validasi ukuran original maks 2MB
  const originalSize = file.size || (file.data ? file.data.length : 0);
  if (originalSize > MAX_FILE_SIZE) {
    throw new Error("File terlalu besar, maksimal 2MB");
  }

  // 2. Validasi tipe gambar
  const mime = (file.mimetype || "").toLowerCase();
  if (!ACCEPTED_MIME.includes(mime)) {
    throw new Error(
      `Format gambar tidak didukung (${mime || "unknown"}). Gunakan JPG, PNG, atau WebP.`,
    );
  }

  // 3. Baca buffer (dari data atau temp file)
  let buffer;
  if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
    buffer = fs.readFileSync(file.tempFilePath);
  } else {
    buffer = file.data;
  }

  // 4. Kompres
  const compressed = await compressBuffer(buffer);

  // 5. Tulis hasil ke temp file utk di-stream oleh lib/cd
  const tmpFile = path.join(os.tmpdir(), `temp_compress_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
  fs.writeFileSync(tmpFile, compressed);

  const compressedFile = {
    name: (file.name || "image.jpg").replace(/\.[^.]+$/, "") + ".jpg",
    mimetype: "image/jpeg",
    data: compressed,
    tempFilePath: tmpFile,
    size: compressed.length,
  };

  try {
    const { url_picture, url_public } = await upload(compressedFile, options);
    // Hapus temp file (upload() juga berusaha menghapus, pastikan sekali lagi)
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* sudah terhapus */
    }
    return { url: url_picture, public_id: url_public };
  } catch (error) {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* sudah terhapus */
    }
    throw error;
  }
}

module.exports = {
  uploadCompressedImage,
  compressBuffer,
  MAX_FILE_SIZE,
  ACCEPTED_MIME,
};