const axios = require("axios");
const env = require("../config/env");

function sanitizeVideoId(raw) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function sanitizePlaylistId(raw) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function parseISODurationToSeconds(iso = "") {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) return 0;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

async function getVideoMetadata(videoId) {
  const cleanVideoId = sanitizeVideoId(videoId);

  if (!cleanVideoId) {
    throw new Error("Invalid videoId");
  }

  if (!env.YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY missing in .env");
  }

  const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
    params: {
      part: "snippet,contentDetails",
      id: cleanVideoId,
      key: env.YOUTUBE_API_KEY
    },
    timeout: 15000
  });

  const item = response.data?.items?.[0];

  if (!item) {
    throw new Error("Video not found");
  }

  return {
    youtubeId: cleanVideoId,
    title: item.snippet?.title || "",
    description: item.snippet?.description || "",
    channelTitle: item.snippet?.channelTitle || "",
    publishedAt: item.snippet?.publishedAt || null,
    thumbnails: {
      default: item.snippet?.thumbnails?.default?.url || "",
      medium: item.snippet?.thumbnails?.medium?.url || "",
      high: item.snippet?.thumbnails?.high?.url || ""
    },
    duration: item.contentDetails?.duration || "",
    durationSec: parseISODurationToSeconds(item.contentDetails?.duration || ""),
    tags: item.snippet?.tags || []
  };
}

async function getPlaylistVideos(playlistId, pageToken = "") {
  const cleanPlaylistId = sanitizePlaylistId(playlistId);

  if (!cleanPlaylistId) {
    throw new Error("Invalid playlistId");
  }

  if (!env.YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY missing in .env");
  }

  const response = await axios.get(
    "https://www.googleapis.com/youtube/v3/playlistItems",
    {
      params: {
        part: "snippet",
        maxResults: 50,
        playlistId: cleanPlaylistId,
        pageToken: String(pageToken || "").trim(),
        key: env.YOUTUBE_API_KEY
      },
      timeout: 15000
    }
  );

  const videos = (response.data?.items || [])
    .map((item) => ({
      videoId: item?.snippet?.resourceId?.videoId || "",
      title: item?.snippet?.title || "",
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

  return {
    playlistId: cleanPlaylistId,
    videos,
    nextPageToken: response.data?.nextPageToken || null
  };
}

module.exports = {
  getVideoMetadata,
  getPlaylistVideos,
  parseISODurationToSeconds
};