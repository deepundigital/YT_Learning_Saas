function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  if (err && err.name === "ValidationError") {
    const details = Object.values(err.errors || {}).map((e) => e.message);

    return res.status(400).json({
      ok: false,
      error: "Validation failed",
      details
    });
  }

  if (err && err.code === 11000) {
    const fields = Object.keys(err.keyPattern || {});
    return res.status(409).json({
      ok: false,
      error: "Duplicate value error",
      details: fields.length ? fields : undefined
    });
  }

  if (err && err.name === "CastError") {
    return res.status(400).json({
      ok: false,
      error: `Invalid ${err.path}`
    });
  }

  return res.status(err.statusCode || 500).json({
    ok: false,
    error: err.message || "Internal server error"
  });
}

module.exports = errorHandler;