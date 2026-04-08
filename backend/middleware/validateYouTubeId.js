module.exports = function validateYouTubeId(paramName = "youtubeId") {
  return function (req, res, next) {
    const value = String(
      req.params[paramName] || req.body?.[paramName] || ""
    ).trim();

    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(value)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid ${paramName}`
      });
    }

    next();
  };
};