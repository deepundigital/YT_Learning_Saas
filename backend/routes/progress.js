const express = require("express");
const auth = require("../middleware/auth");
const Progress = require("../models/Progress");
const Playlist = require("../models/Playlist");

const router = express.Router();

// real-time progress update
router.post("/update", auth, async (req, res) => {
  try {
    const {
      videoId,
      title,
      deltaWatchSec,
      currentPositionSec,
      durationSec
    } = req.body || {};

    if (!videoId) {
      return res.status(400).json({
        ok: false,
        error: "videoId required"
      });
    }

    const userId = req.user.userId || req.user.id;

    const safeDelta = Math.max(0, Math.min(Number(deltaWatchSec) || 0, 10));
    const safePos = Math.max(0, Number(currentPositionSec) || 0);
    const safeDuration = Math.max(0, Number(durationSec) || 0);

    let progress = await Progress.findOne({
      userId,
      videoId
    });

    if (!progress) {
      progress = await Progress.create({
        userId,
        videoId,
        title: title || "Video",
        watchTimeSec: 0,
        lastPositionSec: 0,
        maxPositionSec: 0,
        durationSec: safeDuration,
        completed: false
      });
    }

    progress.title = title || progress.title || "Video";
    progress.watchTimeSec += safeDelta;
    progress.lastPositionSec = safePos;
    progress.maxPositionSec = Math.max(progress.maxPositionSec || 0, safePos);
    progress.durationSec = Math.max(progress.durationSec || 0, safeDuration);
    progress.completed =
      progress.durationSec > 0
        ? progress.watchTimeSec / progress.durationSec >= 0.9
        : progress.completed;
    progress.lastWatchedAt = new Date();

    await progress.save();

    if (safeDuration > 0) {
      await Playlist.updateMany(
        { user: userId, "videos.videoId": videoId },
        { $set: { "videos.$.durationSec": safeDuration } }
      );
    }

    return res.json({
      ok: true,
      progress
    });
  } catch (err) {
    console.error("Progress update error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to update progress",
      details: err.message
    });
  }
});

// get all progress for current user
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const progress = await Progress.find({ userId }).sort({ updatedAt: -1 });

    return res.json({
      ok: true,
      progress
    });
  } catch (err) {
    console.error("Get progress error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to fetch progress",
      details: err.message
    });
  }
});

// analytics summary
router.get("/analytics/summary", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const progress = await Progress.find({ userId });

    let totalWatchTimeSec = 0;
    let completedVideos = 0;

    for (const p of progress) {
      totalWatchTimeSec += p.watchTimeSec || 0;
      if (p.completed) completedVideos++;
    }

    return res.json({
      ok: true,
      summary: {
        totalWatchTimeSec,
        completedVideos,
        totalTrackedVideos: progress.length
      }
    });
  } catch (err) {
    console.error("Progress summary error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to fetch analytics summary",
      details: err.message
    });
  }
});

module.exports = router;