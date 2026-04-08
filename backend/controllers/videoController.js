const Video = require("../models/Video");
const youtubeService = require("../services/youtubeService");

function sanitizeVideoId(raw) {
  if (!raw) return "";
  return String(raw).trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

async function listVideos(req, res, next) {
  try {
    const { q = "", limit = 20 } = req.query;
    const parsedLimit = Math.min(Number(limit) || 20, 50);

    let filter = {};
    if (String(q).trim()) {
      filter = {
        $text: { $search: String(q).trim() }
      };
    }

    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

    return res.status(200).json({
      ok: true,
      count: videos.length,
      videos
    });
  } catch (error) {
    next(error);
  }
}

async function getVideoMeta(req, res, next) {
  try {
    const videoId = sanitizeVideoId(req.params.videoId);

    if (!videoId) {
      return res.status(400).json({
        ok: false,
        error: "Invalid videoId"
      });
    }

    const existing = await Video.findOne({ youtubeId: videoId });
    if (existing) {
      return res.status(200).json({
        ok: true,
        source: "database",
        video: existing
      });
    }

    const metadata = await youtubeService.getVideoMetadata(videoId);

    const video = await Video.create({
      youtubeId: metadata.youtubeId,
      title: metadata.title,
      description: metadata.description,
      channelTitle: metadata.channelTitle,
      thumbnails: metadata.thumbnails,
      durationSec: metadata.durationSec,
      publishedAt: metadata.publishedAt
    });

    return res.status(200).json({
      ok: true,
      source: "youtube",
      video
    });
  } catch (error) {
    next(error);
  }
}

async function createVideo(req, res, next) {
  try {
    const {
      youtubeId,
      title,
      description,
      channelTitle,
      thumbnails,
      durationSec,
      tags,
      transcriptAvailable,
      difficultyLevel,
      category,
      publishedAt
    } = req.body;

    if (!youtubeId || !title) {
      return res.status(400).json({
        ok: false,
        error: "youtubeId and title are required"
      });
    }

    const existing = await Video.findOne({ youtubeId: String(youtubeId).trim() });
    if (existing) {
      return res.status(409).json({
        ok: false,
        error: "Video already exists",
        video: existing
      });
    }

    const video = await Video.create({
      youtubeId: String(youtubeId).trim(),
      title: String(title).trim(),
      description: description || "",
      channelTitle: channelTitle || "",
      thumbnails: thumbnails || {},
      durationSec: Number(durationSec) || 0,
      tags: Array.isArray(tags) ? tags : [],
      transcriptAvailable: Boolean(transcriptAvailable),
      difficultyLevel: difficultyLevel || "unknown",
      category: category || "",
      publishedAt: publishedAt || null
    });

    return res.status(201).json({
      ok: true,
      message: "Video created successfully",
      video
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listVideos,
  getVideoMeta,
  createVideo
};