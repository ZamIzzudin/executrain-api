/** @format */

// =========================================================================
// Auth Controller v2 (PostgreSQL / Prisma)
// =========================================================================

const AuthRepository = require("./repository");

const { encrpyt_one_way, pairing_one_way } = require("../../lib/crypt");
const {
  create_access_token,
  create_refresh_token,
  verify_refresh_token,
} = require("../../lib/jwt");

const { GENESIS_PASSWORD } = require("../../config/var");
const { ROLE, RefreshToken } = require("../../config/enum");

const genesis = async (req, res) => {
  try {
    const userCount = await AuthRepository.count();

    if (userCount > 0) {
      return res.status(400).json({
        status: 400,
        message: "Genesis already created",
      });
    }

    const encrypted_password = await encrpyt_one_way(GENESIS_PASSWORD);

    const user = await AuthRepository.create({
      username: "SUPER",
      display_name: "SUPER",
      role: ROLE.SUPERADMIN,
      password: encrypted_password,
    });

    const access_token = create_access_token(user.id, ROLE.SUPERADMIN);
    const refresh_token = create_refresh_token(user.id, ROLE.SUPERADMIN);

    res.cookie(RefreshToken, refresh_token, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(201).json({
      status: 201,
      message: "success",
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: ROLE.SUPERADMIN,
      access_token,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

const me = async (req, res) => {
  try {
    const token = req.token;
    if (!token) {
      return res.status(400).json({ status: 400, message: "forbidden" });
    }

    const user = await AuthRepository.findById(token.id);
    if (!user) {
      return res.status(400).json({ status: 400, message: "User not found" });
    }

    return res.status(200).json({
      status: 200,
      message: "success",
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
      access_token: token.token,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await AuthRepository.findByUsername(username);
    if (!user) {
      return res.status(400).json({
        status: 400,
        message:
          "username not exist, make sure to register your username first",
      });
    }

    const hashPassword = await pairing_one_way(password.toString(), user.password);
    if (!hashPassword) {
      return res.status(400).json({
        status: 400,
        message: "password doesn't match, please insert a correct password",
      });
    }

    const access_token = create_access_token(user.id, user.role);

    return res.status(200).json({
      status: 200,
      message: "success",
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
      access_token,
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

const refresh = async (req, res) => {
  try {
    const { RefreshToken: cookieToken } = req.cookies;
    if (!cookieToken) {
      return res.status(400).json({ status: 400, message: "forbidden" });
    }

    verify_refresh_token(cookieToken, (error, decoded) => {
      if (error) {
        return res.status(401).json({ status: 401, message: "forbidden" });
      }
      const access_token = create_access_token(decoded.id, decoded.role);
      const refresh_token = create_refresh_token(decoded.id, decoded.role);

      res.cookie(RefreshToken, refresh_token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      return res.status(200).json({
        status: 200,
        message: "success",
        role: decoded.role,
        access_token,
      });
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 500, message: "server error" });
  }
};

const user_list = async (req, res) => {
  try {
    const { search } = req.query;
    const users = search
      ? await AuthRepository.search(search)
      : await AuthRepository.findAll();

    return res.status(200).json({
      status: 200,
      message: "success",
      data: users,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(200).json({
      status: 200,
      data: [],
      message: "No User Found",
    });
  }
};

const register = async (req, res) => {
  const { password, display_name, username } = req.body;
  const role = ROLE.ADMIN;

  try {
    const existing = await AuthRepository.findByUsername(username);
    if (existing) {
      return res.status(400).json({
        status: 400,
        message: "username was used, try use another username",
      });
    }

    const encrypted_password = await encrpyt_one_way(password);
    const new_user = await AuthRepository.create({
      username,
      display_name,
      role,
      password: encrypted_password,
    });

    const access_token = create_access_token(new_user.id, role);
    const refresh_token = create_refresh_token(new_user.id, role);

    res.cookie(RefreshToken, refresh_token, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.status(201).json({
      status: 201,
      message: "success",
      data: {
        id: new_user.id,
        username: new_user.username,
        display_name: new_user.display_name,
        role,
        access_token,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      status: 400,
      message: "failed to create an account",
    });
  }
};

const adjust = async (req, res) => {
  const { id } = req.params;
  const { username = null, display_name = null, password = null } = req.body;

  try {
    const updateData = {
      username,
      display_name,
    };

    if (password && password.trim() !== "") {
      updateData.password = await encrpyt_one_way(password);
    }

    await AuthRepository.update(id, updateData);

    return res.status(200).json({
      status: 200,
      message: `successfully update user ${id}`,
    });
  } catch (err) {
    console.log(err);
    return res.status(404).json({
      status: 404,
      message: "failed to update user",
    });
  }
};

const takedown = async (req, res) => {
  const { id } = req.params;
  try {
    await AuthRepository.remove(id);
    return res.status(200).json({
      status: 200,
      message: `successfully takedown user ${id}`,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      status: 400,
      message: "user not found",
    });
  }
};

module.exports = {
  genesis,
  me,
  login,
  refresh,
  user_list,
  register,
  adjust,
  takedown,
};
