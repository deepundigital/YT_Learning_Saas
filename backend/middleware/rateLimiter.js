const buckets = new Map();

function cleanupBuckets() {
  const now = Date.now();
  for (const [key, data] of buckets.entries()) {
    if (data.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

setInterval(cleanupBuckets, 60 * 1000).unref();

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 60;
  const keyGenerator =
    options.keyGenerator ||
    ((req) => `${req.ip}:${req.baseUrl || ""}:${req.path || ""}`);

  return function rateLimiter(req, res, next) {
    const key = keyGenerator(req);
    const now = Date.now();

    const entry = buckets.get(key);

    if (!entry || entry.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs
      });

      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

      res.setHeader("Retry-After", retryAfterSeconds);

      return res.status(429).json({
        ok: false,
        error: "Too many requests. Please try again later."
      });
    }

    next();
  };
}

module.exports = {
  createRateLimiter
};