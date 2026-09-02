/** @format */

// =========================================================================
// Upload Controller (gambar dengan kompresi)
// =========================================================================

const { uploadCompressedImage } = require("../../lib/imageUpload");
const { destroy } = require("../../lib/cd");
const { AZURE_PUBLIC_BASE_URL, AZURE_IMAGE_CONTAINER, AZURE_VIDEO_CONTAINER } = require("../../config/azure-blob");

const upload_file = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        status: 400,
        message: "File tidak ditemukan (field name harus 'file')",
      });
    }

    const { file } = req.files;
    const { folder } = req.body || {};

    const { url, public_id } = await uploadCompressedImage(file, {
      folder: folder || "skill-accelerator",
    });

    res.status(200).json({
      status: 200,
      message: "success",
      data: {
        url,
        public_id,
      },
    });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(400).json({
      status: 400,
      message: error.message || "Failed to upload file",
    });
  }
};

const delete_file = async (req, res) => {
  try {
    const { url, public_id } = req.query;

    if (!url && !public_id) {
      return res.status(400).json({
        status: 400,
        message: "Query 'url' atau 'public_id' wajib diisi",
      });
    }

    // public_id = blobName (dari hasil upload)
    let blobName = public_id;

    // Jika hanya url: ekstrak blobName dari URL publik
    if (!blobName && url) {
      const baseHosts = [
        AZURE_PUBLIC_BASE_URL.replace(/\/$/, ""),
        "https://storagewebsitetoj.blob.core.windows.net",
      ];
      const parsed = new URL(url);
      const base = `${parsed.protocol}//${parsed.host}`;
      if (!baseHosts.some((h) => h.startsWith(base) || base.startsWith(h))) {
        return res.status(400).json({
          status: 400,
          message: "URL bukan milik storage kita",
        });
      }
      // path: /image/article/xxx.jpg → blobName: article/xxx.jpg
      blobName = parsed.pathname.replace(/^\//, "").split("/").slice(1).join("/");
    }

    if (!blobName) {
      return res.status(400).json({
        status: 400,
        message: "Gagal mengekstrak blob name dari URL",
      });
    }

    await destroy(blobName);

    return res.status(200).json({
      status: 200,
      message: "success",
    });
  } catch (error) {
    console.error("Delete error:", error.message);
    return res.status(400).json({
      status: 400,
      message: error.message || "Failed to delete file",
    });
  }
};

module.exports = { upload_file, delete_file };