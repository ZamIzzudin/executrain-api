/** @format */

const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

const bodyParser = require("body-parser");
const helmet = require("helmet");

const { NODE_ENV, PORT } = require("./src/config/var.js");
const routesV2 = require("./src/routes-v2");

const app = express();

// Middleware
app.use(express.json());

// CORS middleware for API routes
app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );

  next();
});

//enable cors
app.use(
  cors({
    credentials: true,
    origin: "*",
  }),
);

app.use(helmet());

//allow to access cookie
app.use(cookieParser());

//allow request with format x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

//allow request with format json
app.use(bodyParser.json());

//file uploader handler
app.use(
  fileUpload({
    uploadTimeout: 60000,
  }),
);

app.get("/", (_, res) => {
  res.json({
    message: "Welcome to ExecuTrain API [Dev]",
    createdBy: "ayamiyudin",
  });
});

// v2 Routes - PostgreSQL (Prisma)
app.use("/api/v1", routesV2);
app.use("/api/v2", routesV2);

app.get("*", (_, res) => {
  res.status(404).json({
    status: 404,
    message: "Endpoint not found",
  });
});

// Initialize server (PostgreSQL via Prisma)
const server = createServer(app);
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
  console.log(`ENVIRONMENT: ${NODE_ENV}`);
});

module.exports = app;
