/** @format */

const health = require("express").Router();

const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const config = require("../../config/var");

health.get("/", async (_, res) => {
  try {
    const pool = new Pool({ connectionString: config.DATABASE_URL });
    await pool.query("SELECT 1");
    await pool.end();

    res.status(200).json({
      status: 200,
      message: "healthy",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "unhealthy",
      database: "disconnected",
      info: error.message,
    });
  }
});

module.exports = health;
