/** @format */

// =========================================================================
// CDN Upload/Delete helper (Azure Blob Storage)
// =========================================================================
// Konsep:
//   - upload(file, {folder}) -> { url_picture, url_public }
//       url_picture: URL publik di CDN
//       url_public : blob name (public_id style) utk keperluan delete
//   - destroy(blobName) -> hapus blob dari CDN
// =========================================================================

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const {
  imageContainerClient,
  videoContainerClient,
  AZURE_PUBLIC_BASE_URL,
  hasAzureCredentials,
} = require("../config/azure-blob");

const isVideo = (file) => {
  const mime = (file.mimetype || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  return (
    mime.startsWith("video/") ||
    /\.(mp4|webm|mov|avi|mkv|m4v)$/.test(name)
  );
};

const getContainerClient = (file) =>
  isVideo(file) ? videoContainerClient : imageContainerClient;

/**
 * Upload file ke Azure Blob Storage
 * @param {Object} file - File object dari express-fileupload
 * @param {Object} options - { folder: "pages" }
 * @returns {Promise<{url_picture: string, url_public: string}>}
 */
async function upload(file, options = {}) {
  if (!hasAzureCredentials || !imageContainerClient) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING tidak dikonfigurasi");
  }

  const folder = options.folder || "";
  const ext = path.extname(file.name || "") || "";
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString("hex");
  const blobName = `${folder ? folder + "/" : ""}${timestamp}_${randomStr}${ext}`;

  const contentType =
    file.mimetype ||
    (ext ? require("mime-types")?.lookup(ext) : undefined) ||
    "application/octet-stream";

  const containerClient = getContainerClient(file);
  const containerName = isVideo(file)
    ? (process.env.AZURE_VIDEO_CONTAINER || "video")
    : (process.env.AZURE_IMAGE_CONTAINER || "image");
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const headers = { blobHTTPHeaders: { blobContentType: contentType } };

  if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
    try {
      await blockBlobClient.uploadStream(
        fs.createReadStream(file.tempFilePath),
        fs.statSync(file.tempFilePath).size,
        undefined,
        undefined,
        headers,
      );
    } finally {
      try {
        fs.unlinkSync(file.tempFilePath);
      } catch {
        /* temp file sudah terhapus */
      }
    }
  } else {
    await blockBlobClient.uploadData(file.data, headers);
  }

  const baseUrl = AZURE_PUBLIC_BASE_URL.replace(/\/$/, "");
  return {
    url_picture: `${baseUrl}/${containerName}/${blobName}`,
    url_public: blobName,
  };
}

/**
 * Hapus file dari Azure Blob Storage
 * @param {string} blobName
 */
async function destroy(blobName) {
  try {
    if (!blobName || !hasAzureCredentials) {
      console.warn("No blobName/credentials provided for deletion");
      return;
    }
    for (const containerClient of [imageContainerClient, videoContainerClient]) {
      if (!containerClient) continue;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const res = await blockBlobClient.deleteIfExists();
      if (res.succeeded) {
        console.log(`Successfully deleted: ${blobName}`);
        return;
      }
    }
    console.log(`Blob not found for deletion: ${blobName}`);
  } catch (error) {
    console.error(`Error deleting ${blobName}:`, error);
  }
}

module.exports = {
  upload,
  destroy,
};