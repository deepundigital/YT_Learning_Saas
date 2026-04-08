const Bookmark = require("../models/Bookmark");

async function createBookmark(req, res, next) {
  try {
    const { video, playlist, label, note, timestampSec } = req.body;

    if (!video || !/^[a-fA-F0-9]{24}$/.test(String(video))) {
      return res.status(400).json({
        ok: false,
        error: "Valid video is required"
      });
    }

    if (!label || !String(label).trim()) {
      return res.status(400).json({
        ok: false,
        error: "Bookmark label is required"
      });
    }

    const bookmark = await Bookmark.create({
      user: req.user._id,
      video,
      playlist: playlist || null,
      label: String(label).trim(),
      note: note || "",
      timestampSec: Number(timestampSec) || 0
    });

    return res.status(201).json({
      ok: true,
      message: "Bookmark created successfully",
      bookmark
    });
  } catch (error) {
    next(error);
  }
}

async function listBookmarks(req, res, next) {
  try {
    const filter = { user: req.user._id };

    if (req.query.video && /^[a-fA-F0-9]{24}$/.test(String(req.query.video))) {
      filter.video = req.query.video;
    }

    const bookmarks = await Bookmark.find(filter)
      .populate("video")
      .populate("playlist")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      count: bookmarks.length,
      bookmarks
    });
  } catch (error) {
    next(error);
  }
}

async function deleteBookmark(req, res, next) {
  try {
    const deleted = await Bookmark.findOneAndDelete({
      _id: req.params.bookmarkId,
      user: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: "Bookmark not found"
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Bookmark deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBookmark,
  listBookmarks,
  deleteBookmark
};