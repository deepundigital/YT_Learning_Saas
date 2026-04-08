const express = require("express");
const auth = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");
const validateYouTubeId = require("../middleware/validateYouTubeId");
const Bookmark = require("../models/Bookmark");
const Video = require("../models/Video");

const router = express.Router();

function getUserId(req) {
  return req.user.userId || req.user.id;
}

// Create bookmark
router.post("/", auth, async (req, res) => {
  try {
    const {
      youtubeId,
      label,
      note = "",
      timestampSec = 0
    } = req.body || {};

    if (!youtubeId || !label) {
      return res.status(400).json({
        ok: false,
        error: "youtubeId and label are required"
      });
    }

    const video = await Video.findOne({ youtubeId: String(youtubeId).trim() });

    if (!video) {
      return res.status(404).json({
        ok: false,
        error: "Video not found in database. Save/import video first."
      });
    }

    const bookmark = await Bookmark.create({
      user: getUserId(req),
      video: video._id,
      youtubeId: video.youtubeId,
      label: String(label).trim(),
      note: String(note).trim(),
      timestampSec: Math.max(0, Number(timestampSec) || 0)
    });

    return res.status(201).json({
      ok: true,
      bookmark
    });
  } catch (err) {
    console.error("Create bookmark error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to create bookmark",
      details: err.message
    });
  }
});

// Get bookmarks for a video
router.get(
  "/video/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {
      const youtubeId = String(req.params.youtubeId || "").trim();

      const bookmarks = await Bookmark.find({
        user: getUserId(req),
        youtubeId
      }).sort({ timestampSec: 1, createdAt: -1 });

      return res.json({
        ok: true,
        bookmarks
      });
    } catch (err) {
      console.error("Get bookmarks error:", err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch bookmarks",
        details: err.message
      });
    }
  }
);

// Delete bookmark
router.delete("/:id", auth, validateObjectId("id"), async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      _id: req.params.id,
      user: getUserId(req)
    });

    if (!bookmark) {
      return res.status(404).json({
        ok: false,
        error: "Bookmark not found"
      });
    }

    return res.json({
      ok: true,
      message: "Bookmark deleted successfully"
    });
  } catch (err) {
    console.error("Delete bookmark error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to delete bookmark",
      details: err.message
    });
  }
});

module.exports = router;