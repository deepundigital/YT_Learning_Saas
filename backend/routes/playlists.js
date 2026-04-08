const express = require("express");
const axios = require("axios");

const auth = require("../middleware/auth");
const Playlist = require("../models/Playlist");
const env = require("../config/env");

const router = express.Router();

function sanitizeText(value) {
  return String(value || "").trim();
}

function sanitizePlaylistId(raw) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function sanitizeVideoId(raw) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function youtubeErrorToMessage(err) {
  const data = err?.response?.data;
  if (data?.error?.message) return data.error.message;
  if (typeof data === "string") return data;
  return err?.message || "Unknown error";
}

// Create playlist
router.post("/", auth, async (req, res) => {
  try {
    const name = sanitizeText(req.body?.name);

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: "Playlist name is required"
      });
    }

    const playlist = await Playlist.create({
      user: req.user.userId || req.user.id,
      name,
      videos: []
    });

    return res.status(201).json({
      ok: true,
      playlist
    });
  } catch (err) {
    console.error("Create playlist error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to create playlist",
      details: err.message
    });
  }
});

// Get all playlists of current user
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const playlists = await Playlist.find({ user: userId })
      .sort({ createdAt: -1 });

    return res.json({
      ok: true,
      playlists
    });
  } catch (err) {
    console.error("Get playlists error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch playlists",
      details: err.message
    });
  }
});

// Rename playlist
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const playlistId = req.params.id;
    const name = sanitizeText(req.body?.name);

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: "Playlist name is required"
      });
    }

    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId, user: userId },
      { name },
      { new: true }
    );

    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: "Playlist not found"
      });
    }

    return res.json({
      ok: true,
      playlist
    });
  } catch (err) {
    console.error("Rename playlist error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to rename playlist",
      details: err.message
    });
  }
});

// Delete playlist
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const playlistId = req.params.id;

    const playlist = await Playlist.findOneAndDelete({
      _id: playlistId,
      user: userId
    });

    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: "Playlist not found"
      });
    }

    return res.json({
      ok: true,
      message: "Playlist deleted successfully"
    });
  } catch (err) {
    console.error("Delete playlist error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to delete playlist",
      details: err.message
    });
  }
});

// Add single video to playlist
router.post("/:id/videos", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const playlistId = req.params.id;

    const video = {
      videoId: sanitizeVideoId(req.body?.videoId),
      title: sanitizeText(req.body?.title),
      thumbnail: sanitizeText(req.body?.thumbnail)
    };

    if (!video.videoId || !video.title) {
      return res.status(400).json({
        ok: false,
        error: "videoId and title are required"
      });
    }

    const playlist = await Playlist.findOne({ _id: playlistId, user: userId });

    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: "Playlist not found"
      });
    }

    const alreadyExists = playlist.videos.some(
      (v) => v.videoId === video.videoId
    );

    if (!alreadyExists) {
      playlist.videos.push(video);
      await playlist.save();
    }

    return res.json({
      ok: true,
      playlist
    });
  } catch (err) {
    console.error("Add video to playlist error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to add video to playlist",
      details: err.message
    });
  }
});

// Remove video from playlist
router.delete("/:id/videos/:videoId", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const playlistId = req.params.id;
    const videoId = sanitizeVideoId(req.params.videoId);

    const playlist = await Playlist.findOne({ _id: playlistId, user: userId });

    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: "Playlist not found"
      });
    }

    playlist.videos = playlist.videos.filter((v) => v.videoId !== videoId);
    await playlist.save();

    return res.json({
      ok: true,
      playlist
    });
  } catch (err) {
    console.error("Remove video from playlist error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to remove video from playlist",
      details: err.message
    });
  }
});

// Import YouTube playlist
router.post("/import", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const playlistId = sanitizePlaylistId(req.body?.playlistId);
    const name = sanitizeText(req.body?.name) || "Imported Playlist";

    if (!playlistId) {
      return res.status(400).json({
        ok: false,
        error: "playlistId is required"
      });
    }

    if (!env.YOUTUBE_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "YOUTUBE_API_KEY missing in .env"
      });
    }

    let nextPageToken = "";
    let importedVideos = [];

    do {
      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          params: {
            part: "snippet",
            maxResults: 50,
            playlistId,
            pageToken: nextPageToken || "",
            key: env.YOUTUBE_API_KEY
          },
          timeout: 15000
        }
      );

      const items = response.data.items || [];

      const mapped = items
        .map((item) => ({
          videoId: item?.snippet?.resourceId?.videoId,
          title: item?.snippet?.title,
          thumbnail:
            item?.snippet?.thumbnails?.medium?.url ||
            item?.snippet?.thumbnails?.default?.url ||
            ""
        }))
        .filter(
          (v) =>
            v.videoId &&
            v.title &&
            v.title !== "Private video" &&
            v.title !== "Deleted video"
        );

      importedVideos.push(...mapped);
      nextPageToken = response.data.nextPageToken || "";
    } while (nextPageToken);

    const uniqueVideosMap = new Map();
    for (const v of importedVideos) {
      if (!uniqueVideosMap.has(v.videoId)) {
        uniqueVideosMap.set(v.videoId, v);
      }
    }

    const uniqueVideos = Array.from(uniqueVideosMap.values());

    const playlist = await Playlist.create({
      user: userId,
      name,
      sourcePlaylistId: playlistId,
      videos: uniqueVideos
    });

    return res.status(201).json({
      ok: true,
      playlist,
      importedCount: uniqueVideos.length
    });
  } catch (err) {
    const msg = youtubeErrorToMessage(err);
    console.error("Import playlist error:", err?.response?.data || err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to import YouTube playlist",
      details: msg
    });
  }
});

module.exports = router;