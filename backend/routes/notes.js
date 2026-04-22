const express = require("express");
const auth = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");
const validateYouTubeId = require("../middleware/validateYouTubeId");
const Note = require("../models/Note");
const Video = require("../models/Video");

const router = express.Router();

function getUserId(req) {
  return req.user.userId || req.user.id;
}

// Create note
router.post("/", auth, async (req, res) => {
  try {
    const {
      youtubeId,
      title,
      content,
      timestampSec = 0,
      tags = [],
      type = "manual"
    } = req.body || {};

    if (!youtubeId || !content) {
      return res.status(400).json({
        ok: false,
        error: "youtubeId and content are required"
      });
    }

    const video = await Video.findOne({ youtubeId: String(youtubeId).trim() });

    if (!video) {
      return res.status(404).json({
        ok: false,
        error: "Video not found in database. Save/import video first."
      });
    }

    const note = await Note.create({
      user: getUserId(req),
      video: video._id,
      youtubeId: video.youtubeId,
      title: String(title || "").trim(),
      content: String(content).trim(),
      timestampSec: Math.max(0, Number(timestampSec) || 0),
      tags: Array.isArray(tags)
        ? tags.map((t) => String(t).trim()).filter(Boolean)
        : [],
      type
    });

    return res.status(201).json({
      ok: true,
      note
    });
  } catch (err) {
    console.error("Create note error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to create note",
      details: err.message
    });
  }
});

// Get notes for a video
router.get(
  "/video/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {
      const youtubeId = String(req.params.youtubeId || "").trim();

      const notes = await Note.find({
        user: getUserId(req),
        youtubeId
      }).sort({ timestampSec: 1, createdAt: -1 });

      return res.json({
        ok: true,
        notes
      });
    } catch (err) {
      console.error("Get notes error:", err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch notes",
        details: err.message
      });
    }
  }
);

// Update note
router.put("/:id", auth, validateObjectId("id"), async (req, res) => {
  try {
    const updates = {};
    const { title, content, timestampSec, tags, type } = req.body || {};

    if (title !== undefined) updates.title = String(title).trim();
    if (content !== undefined) updates.content = String(content).trim();
    if (timestampSec !== undefined) updates.timestampSec = Math.max(0, Number(timestampSec) || 0);
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags)
        ? tags.map((t) => String(t).trim()).filter(Boolean)
        : [];
    }
    if (type !== undefined) updates.type = type;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: getUserId(req) },
      updates,
      { returnDocument: "after" }
    );

    if (!note) {
      return res.status(404).json({
        ok: false,
        error: "Note not found"
      });
    }

    return res.json({
      ok: true,
      note
    });
  } catch (err) {
    console.error("Update note error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to update note",
      details: err.message
    });
  }
});

// Delete note
router.delete("/:id", auth, validateObjectId("id"), async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: getUserId(req)
    });

    if (!note) {
      return res.status(404).json({
        ok: false,
        error: "Note not found"
      });
    }

    return res.json({
      ok: true,
      message: "Note deleted successfully"
    });
  } catch (err) {
    console.error("Delete note error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to delete note",
      details: err.message
    });
  }
});

module.exports = router;