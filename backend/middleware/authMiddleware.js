const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.headers.authorization) {
    token = req.headers.authorization;
  }

  if (!token) {
    return res.status(401).json({ ok: false, error: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // The token has the user _id
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ ok: false, error: "Not authorized, token failed" });
  }
};
