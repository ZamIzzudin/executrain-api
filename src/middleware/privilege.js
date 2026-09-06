/** @format */

const { verify_access_token } = require("../lib/jwt");

const islogin = (req, res, next) => {
  let access_token = req.headers.authorization;
  if (!access_token) {
    return res.status(401).json({
      status: 401,
      message: "failed",
      info: "no detected token",
    });
  }

  try {
    access_token = access_token.split(" ")[1];

    verify_access_token(access_token, (error, decoded) => {
      if (error) {
        return res.status(401).json({
          status: 401,
          message: "failed",
          info: "expired token",
        });
      }

      req.token = { ...decoded, token: access_token };
      next();
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "failed",
      info: "server error",
    });
  }
};

/**
 * Proteksi khusus SUPERADMIN. Harus dipasang SETELAH islogin.
 * Hanya role SUPERADMIN dari token JWT yang boleh lanjut.
 */
const isSuperAdmin = (req, res, next) => {
  const role = req.token?.role;
  if (role !== "SUPERADMIN") {
    return res.status(403).json({
      status: 403,
      message: "failed",
      info: "forbidden, super admin only",
    });
  }
  next();
};

module.exports = { islogin, isSuperAdmin };
