const express = require("express");
const { auth, requireAdmin } = require("../middleware/auth");
const User = require("../models/User");
const Certificate = require("../models/Certificate");
const Playlist = require("../models/Playlist");
const Progress = require("../models/Progress");

const router = express.Router();

router.get("/summary", auth, requireAdmin, async (req, res, next) => {
  try {
    const [users, certificates, playlists, progress] = await Promise.all([
      User.countDocuments(),
      Certificate.countDocuments(),
      Playlist.countDocuments(),
      Progress.countDocuments()
    ]);

    return res.status(200).json({
      ok: true,
      summary: {
        users,
        certificates,
        playlists,
        progress
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;