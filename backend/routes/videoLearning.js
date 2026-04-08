const express = require("express");

const { auth } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/rateLimiter");
const videoLearningController = require("../controllers/videoLearningController");

const router = express.Router();

const videoLearningLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10
});

router.post(
  "/video-learning",
  auth,
  videoLearningLimiter,
  videoLearningController.getVideoLearningPack
);

module.exports = router;