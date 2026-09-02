/** @format */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "development",
  // PostgreSQL (Prisma) - pakai DB dev saat NODE_ENV=development
  DATABASE_URL:
    process.env.NODE_ENV === "development" && process.env.DATABASE_URL_DEV
      ? process.env.DATABASE_URL_DEV
      : process.env.DATABASE_URL,
  DATABASE_URL_DEV: process.env.DATABASE_URL_DEV,
  MAX_AGE_ACCESS_TOKEN: process.env.MAX_AGE_ACCESS_TOKEN,
  MAX_AGE_REFRESH_TOKEN: process.env.MAX_AGE_REFRESH_TOKEN,
  REFRESH_TOKEN: process.env.REFRESH_TOKEN,
  ACCESS_TOKEN: process.env.ACCESS_TOKEN,
  GENESIS_PASSWORD: process.env.GENESIS_PASSWORD,
  SMTP_GMAIL_USER: process.env.SMTP_GMAIL_USER,
  SMTP_GMAIL_APP_PASSWORD: process.env.SMTP_GMAIL_APP_PASSWORD,
  SMTP_GMAIL_FROM_NAME: process.env.SMTP_GMAIL_FROM_NAME,
  // Azure Blob (CDN)
  AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
  AZURE_CONTAINER_NAME: process.env.AZURE_CONTAINER_NAME,
  AZURE_PUBLIC_BASE_URL: process.env.AZURE_PUBLIC_BASE_URL,
  AZURE_IMAGE_CONTAINER: process.env.AZURE_IMAGE_CONTAINER,
  AZURE_VIDEO_CONTAINER: process.env.AZURE_VIDEO_CONTAINER,
};

module.exports = config;
