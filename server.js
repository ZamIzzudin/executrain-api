/** @format */

const { createServer } = require("http");

const app = require("./src/app");
const { NODE_ENV, PORT } = require("./src/config/var.js");

const server = createServer(app);
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
  console.log(`ENVIRONMENT: ${NODE_ENV}`);
});

module.exports = app;
