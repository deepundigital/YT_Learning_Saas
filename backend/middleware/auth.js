const jwt = require("jsonwebtoken");
const env = require("../config/env");

module.exports = function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        ok: false,
        error: "No token provided"
      });
    }

    const parts = authHeader.split(" ");
    const token = parts.length === 2 ? parts[1] : parts[0];

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;

    return next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      error: "Invalid token"
    });
  }
};