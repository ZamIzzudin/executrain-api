/** @format */

const health = require("express").Router();

const { pool } = require("../../config/prisma");

health.get("/", async (_, res) => {
  try {
    await pool.query("SELECT 1");

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
