/** @format */

// =========================================================================
// Azure Blob Storage Configuration (CDN)
// =========================================================================
// Endpoint & kredensial diambil dari variabel env (.env).
// Containers: image (gambar), video (video).
// =========================================================================

const { BlobServiceClient } = require("@azure/storage-blob");
const config = require("./var");

const AZURE_CONNECTION_STRING = config.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_IMAGE_CONTAINER = config.AZURE_IMAGE_CONTAINER || "image";
const AZURE_VIDEO_CONTAINER = config.AZURE_VIDEO_CONTAINER || "video";
const AZURE_PUBLIC_BASE_URL =
  config.AZURE_PUBLIC_BASE_URL ||
  "https://storagewebsitetoj.blob.core.windows.net";

const blobServiceClient = AZURE_CONNECTION_STRING
  ? BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING)
  : null;

const imageContainerClient = blobServiceClient
  ? blobServiceClient.getContainerClient(AZURE_IMAGE_CONTAINER)
  : null;
const videoContainerClient = blobServiceClient
  ? blobServiceClient.getContainerClient(AZURE_VIDEO_CONTAINER)
  : null;

module.exports = {
  blobServiceClient,
  imageContainerClient,
  videoContainerClient,
  AZURE_IMAGE_CONTAINER,
  AZURE_VIDEO_CONTAINER,
  AZURE_PUBLIC_BASE_URL,
  hasAzureCredentials: Boolean(AZURE_CONNECTION_STRING),
};