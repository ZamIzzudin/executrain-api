/** @format */

const os = require("os");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const helmet = require("helmet");

const routesV2 = require("./routes-v2");

const app = express();

app.set("trust proxy", 1);

app.use(express.json({ limit: "6mb" }));

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

app.use(
  cors({
    credentials: true,
    origin: "*",
  }),
);

app.use(helmet());

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false, limit: "6mb" }));

app.use(bodyParser.json({ limit: "6mb" }));

app.use(
  fileUpload({
    uploadTimeout: 60000,
    useTempFiles: true,
    tempFileDir: os.tmpdir(),
    limits: { fileSize: 5 * 1024 * 1024 },
  }),
);

app.get("/", (_, res) => {
  res.json({
    message: "Welcome to ExecuTrain API",
    createdBy: "ayamiyudin",
  });
});

app.use("/api/v1", routesV2);
app.use("/api/v2", routesV2);

app.get("*", (_, res) => {
  res.status(404).json({
    status: 404,
    message: "Endpoint not found",
  });
});

module.exports = app;
