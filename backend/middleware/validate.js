function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || "").trim());
}

const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!isNonEmptyString(name) || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (!isValidEmail(email)) {
    errors.push("Valid email is required");
  }

  if (!isNonEmptyString(password) || String(password).length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (errors.length) {
    return res.status(400).json({
      ok: false,
      error: "Validation failed",
      details: errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  if (!isValidEmail(email)) {
    errors.push("Valid email is required");
  }

  if (!isNonEmptyString(password)) {
    errors.push("Password is required");
  }

  if (errors.length) {
    return res.status(400).json({
      ok: false,
      error: "Validation failed",
      details: errors
    });
  }

  next();
};

const validateObjectIdField = (fieldName) => {
  return (req, res, next) => {
    const value =
      req.params?.[fieldName] ??
      req.body?.[fieldName] ??
      req.query?.[fieldName];

    if (!isNonEmptyString(String(value || "")) || !/^[a-fA-F0-9]{24}$/.test(String(value))) {
      return res.status(400).json({
        ok: false,
        error: `Invalid ${fieldName}`
      });
    }

    next();
  };
};

const validatePlaylistCreate = (req, res, next) => {
  const { title } = req.body || {};

  if (!isNonEmptyString(title) || title.trim().length < 2) {
    return res.status(400).json({
      ok: false,
      error: "Playlist title must be at least 2 characters long"
    });
  }

  next();
};

const validateProgressUpdate = (req, res, next) => {
  const {
    videoId,
    playlistId,
    watchedSeconds,
    lastPositionSec,
    maxPositionSec,
    durationSec,
    completionPercent,
    isCompleted
  } = req.body || {};

  if (!isNonEmptyString(videoId) || !/^[a-fA-F0-9]{24}$/.test(String(videoId))) {
    return res.status(400).json({
      ok: false,
      error: "Invalid videoId"
    });
  }

  if (playlistId && !/^[a-fA-F0-9]{24}$/.test(String(playlistId))) {
    return res.status(400).json({
      ok: false,
      error: "Invalid playlistId"
    });
  }

  const numberFields = {
    watchedSeconds,
    lastPositionSec,
    maxPositionSec,
    durationSec,
    completionPercent
  };

  for (const [key, value] of Object.entries(numberFields)) {
    if (
      value !== undefined &&
      (typeof value !== "number" || Number.isNaN(value) || value < 0)
    ) {
      return res.status(400).json({
        ok: false,
        error: `${key} must be a non-negative number`
      });
    }
  }

  if (
    completionPercent !== undefined &&
    (completionPercent < 0 || completionPercent > 100)
  ) {
    return res.status(400).json({
      ok: false,
      error: "completionPercent must be between 0 and 100"
    });
  }

  if (isCompleted !== undefined && typeof isCompleted !== "boolean") {
    return res.status(400).json({
      ok: false,
      error: "isCompleted must be boolean"
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateObjectIdField,
  validatePlaylistCreate,
  validateProgressUpdate
};