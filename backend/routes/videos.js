const express = require("express");
const auth = require("../middleware/auth");
const Video = require("../models/Video");
const {
  getVideoMetadata,
  getPlaylistVideos,
  searchYouTube
} = require("../services/youtubeService");

const router = express.Router();

function sanitizeVideoId(raw) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function sanitizePlaylistId(raw) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

// Search YouTube educational content
router.get("/search", auth, async (req, res) => {
  try {
    const { q, type, maxResults } = req.query;

    if (!q) {
      return res.status(400).json({
        ok: false,
        error: "Search query 'q' is required"
      });
    }

    const results = await searchYouTube(
      q,
      type || "playlist",
      parseInt(maxResults) || 10
    );

    return res.json({
      ok: true,
      results
    });
  } catch (err) {
    console.error("YouTube search error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to search YouTube",
      details: err.message
    });
  }
});

// Import/save a video in DB
router.post("/import", auth, async (req, res) => {
  try {
    const youtubeId = sanitizeVideoId(req.body?.youtubeId);

    if (!youtubeId) {
      return res.status(400).json({
        ok: false,
        error: "youtubeId is required"
      });
    }

    let video = await Video.findOne({ youtubeId });

    if (video) {
      return res.json({
        ok: true,
        source: "database",
        video
      });
    }

    const meta = await getVideoMetadata(youtubeId);

    video = await Video.create({
      youtubeId: meta.youtubeId,
      title: meta.title,
      description: meta.description,
      channelTitle: meta.channelTitle,
      thumbnails: meta.thumbnails,
      duration: meta.duration,
      durationSec: meta.durationSec,
      publishedAt: meta.publishedAt ? new Date(meta.publishedAt) : null,
      tags: meta.tags || [],
      metadataFetchedAt: new Date()
    });

    return res.status(201).json({
      ok: true,
      source: "youtube",
      video
    });
  } catch (err) {
    console.error("Video import error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to import video",
      details: err.message
    });
  }
});

// Get single video metadata, prefer DB
router.get("/meta/:videoId", auth, async (req, res) => {
  try {
    const videoId = sanitizeVideoId(req.params.videoId);

    if (!videoId) {
      return res.status(400).json({
        ok: false,
        error: "Valid videoId is required"
      });
    }

    const existing = await Video.findOne({ youtubeId: videoId });

    if (existing) {
      return res.json({
        ok: true,
        source: "database",
        video: existing
      });
    }

    const meta = await getVideoMetadata(videoId);

    const video = await Video.create({
      youtubeId: meta.youtubeId,
      title: meta.title,
      description: meta.description,
      channelTitle: meta.channelTitle,
      thumbnails: meta.thumbnails,
      duration: meta.duration,
      durationSec: meta.durationSec,
      publishedAt: meta.publishedAt ? new Date(meta.publishedAt) : null,
      tags: meta.tags || [],
      metadataFetchedAt: new Date()
    });

    return res.json({
      ok: true,
      source: "youtube",
      video
    });
  } catch (err) {
    console.error("Video meta error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to fetch video metadata",
      details: err.message
    });
  }
});

// Get saved video by Mongo id
router.get("/:id", auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        ok: false,
        error: "Video not found"
      });
    }

    return res.json({
      ok: true,
      video
    });
  } catch (err) {
    console.error("Get video by id error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch video",
      details: err.message
    });
  }
});

// List saved videos
router.get("/", auth, async (req, res) => {
  try {
    const videos = await Video.find().sort({ updatedAt: -1 }).limit(100);

    return res.json({
      ok: true,
      videos
    });
  } catch (err) {
    console.error("List videos error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch videos",
      details: err.message
    });
  }
});

// Get playlist videos directly from YouTube
router.get("/playlist/:playlistId", auth, async (req, res) => {
  try {
    const playlistId = sanitizePlaylistId(req.params.playlistId);

    if (!playlistId) {
      return res.status(400).json({
        ok: false,
        error: "Valid playlistId is required"
      });
    }

    const pageToken = String(req.query.pageToken || "").trim();
    const result = await getPlaylistVideos(playlistId, pageToken);

    return res.json({
      ok: true,
      ...result
    });
  } catch (err) {
    console.error("Playlist videos error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to fetch playlist videos",
      details: err.message
    });
  }
});

module.exports = router;