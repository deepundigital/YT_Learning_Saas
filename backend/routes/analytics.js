const express = require("express");
const mongoose = require("mongoose");

const auth = require("../middleware/auth");
const validateYouTubeId = require("../middleware/validateYouTubeId");
const Video = require("../models/Video");
const Note = require("../models/Note");
const Bookmark = require("../models/Bookmark");
const Progress = require("../models/Progress");
const AIInteraction = require("../models/AIInteraction");
const StudyGoal = require("../models/StudyGoal");

const router = express.Router();

function getUserId(req) {
  return req.user.userId || req.user.id;
}

function sanitizeVideoId(raw) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

router.get("/dashboard", auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(getUserId(req));

    const [
      totalVideos,
      totalNotes,
      totalBookmarks,
      totalAIInteractions,
      totalGoals,
      completedGoals,
      progressItems,
      recentNotes,
      recentBookmarks,
      recentAI
    ] = await Promise.all([
      Video.countDocuments(),
      Note.countDocuments({ user: userId }),
      Bookmark.countDocuments({ user: userId }),
      AIInteraction.countDocuments({ user: userId }),
      StudyGoal.countDocuments({ user: userId }),
      StudyGoal.countDocuments({ user: userId, status: "completed" }),
      Progress.find({ userId }).sort({ updatedAt: -1 }),
      Note.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("_id youtubeId title content timestampSec type createdAt"),
      Bookmark.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("_id youtubeId label note timestampSec createdAt"),
      AIInteraction.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("_id youtubeId type input output source createdAt")
    ]);

    const totalWatchTimeSec = progressItems.reduce(
      (sum, item) => sum + (item.watchTimeSec || 0),
      0
    );

    const completedVideos = progressItems.filter((item) => item.completed).length;

    const recentProgress = progressItems.slice(0, 5).map((item) => ({
      _id: item._id,
      videoId: item.videoId,
      title: item.title,
      watchTimeSec: item.watchTimeSec,
      lastPositionSec: item.lastPositionSec,
      durationSec: item.durationSec,
      completed: item.completed,
      updatedAt: item.updatedAt
    }));

    return res.json({
      ok: true,
      stats: {
        totalVideos,
        totalNotes,
        totalBookmarks,
        totalAIInteractions,
        totalGoals,
        completedGoals,
        completedVideos,
        totalTrackedVideos: progressItems.length,
        totalWatchTimeSec
      },
      recent: {
        progress: recentProgress,
        notes: recentNotes,
        bookmarks: recentBookmarks,
        ai: recentAI
      }
    });
  } catch (err) {
    console.error("Analytics dashboard error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to fetch dashboard analytics",
      details: err.message
    });
  }
});

router.get(
  "/video/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {
      const userId = new mongoose.Types.ObjectId(getUserId(req));
      const youtubeId = sanitizeVideoId(req.params.youtubeId);

      const [video, notes, bookmarks, progress, aiInteractions] = await Promise.all([
        Video.findOne({ youtubeId }),
        Note.find({ user: userId, youtubeId }).sort({ timestampSec: 1, createdAt: -1 }),
        Bookmark.find({ user: userId, youtubeId }).sort({ timestampSec: 1, createdAt: -1 }),
        Progress.findOne({ userId, videoId: youtubeId }),
        AIInteraction.find({ user: userId, youtubeId }).sort({ createdAt: -1 })
      ]);

      return res.json({
        ok: true,
        video,
        stats: {
          notesCount: notes.length,
          bookmarksCount: bookmarks.length,
          aiInteractionsCount: aiInteractions.length,
          watchTimeSec: progress?.watchTimeSec || 0,
          lastPositionSec: progress?.lastPositionSec || 0,
          durationSec: progress?.durationSec || 0,
          completed: progress?.completed || false
        },
        notes,
        bookmarks,
        aiInteractions
      });
    } catch (err) {
      console.error("Analytics video error:", err.message);

      return res.status(500).json({
        ok: false,
        error: "Failed to fetch video analytics",
        details: err.message
      });
    }
  }
);

module.exports = router;