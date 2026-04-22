const jwt = require("jsonwebtoken");
const env = require("../config/env");

module.exports = function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.JWT_SECRET);

    console.log("Decoded token:", decoded);

    // IMPORTANT: match key correctly
    req.user = {
      id: decoded.id || decoded._id || decoded.userId
    };
    
    // Add _id for backwards compatibility with older routes
    req.user._id = req.user.id;

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};