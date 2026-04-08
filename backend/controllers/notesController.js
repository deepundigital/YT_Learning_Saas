const Note = require("../models/Note");

async function createNote(req, res, next) {
  try {
    const { video, playlist, title, content, timestampSec, color, tags, isPinned } = req.body;

    if (!video || !/^[a-fA-F0-9]{24}$/.test(String(video))) {
      return res.status(400).json({
        ok: false,
        error: "Valid video is required"
      });
    }

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        ok: false,
        error: "Note content is required"
      });
    }

    const note = await Note.create({
      user: req.user._id,
      video,
      playlist: playlist || null,
      title: title || "",
      content: String(content).trim(),
      timestampSec: Number(timestampSec) || 0,
      color: color || "#fef08a",
      tags: Array.isArray(tags) ? tags : [],
      isPinned: Boolean(isPinned)
    });

    return res.status(201).json({
      ok: true,
      message: "Note created successfully",
      note
    });
  } catch (error) {
    next(error);
  }
}

async function listNotes(req, res, next) {
  try {
    const filter = { user: req.user._id };

    if (req.query.video && /^[a-fA-F0-9]{24}$/.test(String(req.query.video))) {
      filter.video = req.query.video;
    }

    if (req.query.playlist && /^[a-fA-F0-9]{24}$/.test(String(req.query.playlist))) {
      filter.playlist = req.query.playlist;
    }

    const notes = await Note.find(filter)
      .populate("video")
      .populate("playlist")
      .sort({ isPinned: -1, createdAt: -1 });

    return res.status(200).json({
      ok: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    next(error);
  }
}

async function updateNote(req, res, next) {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.noteId, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({
        ok: false,
        error: "Note not found"
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Note updated successfully",
      note
    });
  } catch (error) {
    next(error);
  }
}

async function deleteNote(req, res, next) {
  try {
    const deleted = await Note.findOneAndDelete({
      _id: req.params.noteId,
      user: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: "Note not found"
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Note deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createNote,
  listNotes,
  updateNote,
  deleteNote
};