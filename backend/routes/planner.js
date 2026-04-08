const express = require("express");
const auth = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");
const StudyGoal = require("../models/StudyGoal");

const router = express.Router();

function getUserId(req) {
  return req.user.userId || req.user.id;
}

function sanitizeYoutubeIds(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((id) => String(id || "").trim().replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean);
}

// Create study goal
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description = "",
      youtubeIds = [],
      targetDate = null,
      dailyMinutes = 30
    } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        ok: false,
        error: "title is required"
      });
    }

    const goal = await StudyGoal.create({
      user: getUserId(req),
      title: String(title).trim(),
      description: String(description).trim(),
      youtubeIds: sanitizeYoutubeIds(youtubeIds),
      targetDate: targetDate ? new Date(targetDate) : null,
      dailyMinutes: Math.max(1, Number(dailyMinutes) || 30)
    });

    return res.status(201).json({
      ok: true,
      goal
    });
  } catch (err) {
    console.error("Create goal error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to create study goal",
      details: err.message
    });
  }
});

// Get all goals
router.get("/", auth, async (req, res) => {
  try {
    const goals = await StudyGoal.find({ user: getUserId(req) }).sort({
      createdAt: -1
    });

    return res.json({
      ok: true,
      goals
    });
  } catch (err) {
    console.error("Get goals error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch study goals",
      details: err.message
    });
  }
});

// Get one goal
router.get("/:id", auth, validateObjectId("id"), async (req, res) => {
  try {
    const goal = await StudyGoal.findOne({
      _id: req.params.id,
      user: getUserId(req)
    });

    if (!goal) {
      return res.status(404).json({
        ok: false,
        error: "Study goal not found"
      });
    }

    return res.json({
      ok: true,
      goal
    });
  } catch (err) {
    console.error("Get goal error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch study goal",
      details: err.message
    });
  }
});

// Update goal
router.put("/:id", auth, validateObjectId("id"), async (req, res) => {
  try {
    const updates = {};
    const {
      title,
      description,
      youtubeIds,
      targetDate,
      dailyMinutes,
      status
    } = req.body || {};

    if (title !== undefined) updates.title = String(title).trim();
    if (description !== undefined) updates.description = String(description).trim();
    if (youtubeIds !== undefined) updates.youtubeIds = sanitizeYoutubeIds(youtubeIds);
    if (targetDate !== undefined) updates.targetDate = targetDate ? new Date(targetDate) : null;
    if (dailyMinutes !== undefined) updates.dailyMinutes = Math.max(1, Number(dailyMinutes) || 30);
    if (status !== undefined) updates.status = status;

    if (status === "completed") {
      updates.completedAt = new Date();
    }

    const goal = await StudyGoal.findOneAndUpdate(
      { _id: req.params.id, user: getUserId(req) },
      updates,
      { new: true }
    );

    if (!goal) {
      return res.status(404).json({
        ok: false,
        error: "Study goal not found"
      });
    }

    return res.json({
      ok: true,
      goal
    });
  } catch (err) {
    console.error("Update goal error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to update study goal",
      details: err.message
    });
  }
});

// Delete goal
router.delete("/:id", auth, validateObjectId("id"), async (req, res) => {
  try {
    const goal = await StudyGoal.findOneAndDelete({
      _id: req.params.id,
      user: getUserId(req)
    });

    if (!goal) {
      return res.status(404).json({
        ok: false,
        error: "Study goal not found"
      });
    }

    return res.json({
      ok: true,
      message: "Study goal deleted successfully"
    });
  } catch (err) {
    console.error("Delete goal error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to delete study goal",
      details: err.message
    });
  }
});

module.exports = router;