const express = require("express");
const cors = require("cors");
const axios = require("axios");
const helmet = require("helmet");

const authRoutes = require("./routes/auth");
const playlistRoutes = require("./routes/playlists");
const progressRoutes = require("./routes/progress");
const videoRoutes = require("./routes/videos");
const noteRoutes = require("./routes/notes");
const bookmarkRoutes = require("./routes/bookmarks");
const transcriptRoutes = require("./routes/transcripts");
const aiRoutes = require("./routes/ai");
const plannerRoutes = require("./routes/planner");
const analyticsRoutes = require("./routes/analytics");
const revisionRoutes = require("./routes/revision");
const certificateRoutes = require("./routes/certificates");
const communityRoutes = require("./routes/community");
const activityRoutes = require("./routes/activity");
const taskRoutes = require("./routes/tasks");
const timetableRoutes = require("./routes/timetable");
const codingRoutes = require("./routes/coding");

const errorHandler = require("./middleware/errorHandler");
const env = require("./config/env");
const {
  authLimiter,
  aiLimiter,
  generalLimiter
} = require("./middleware/rateLimiters");

function sanitizePlaylistId(raw) {
  if (!raw) return "";
  return String(raw).trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function youtubeErrorToMessage(err) {
  const data = err?.response?.data;
  if (data?.error?.message) return data.error.message;
  if (typeof data === "string") return data;
  return err?.message || "Unknown error";
}

function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    helmet({
      crossOriginResourcePolicy: false
    })
  );

  app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }));

  app.options("*", cors());

  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
  });

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use(generalLimiter);

  app.get("/", (req, res) => {
    res.json({
      ok: true,
      message: "Backend is running ✅",
      time: new Date().toISOString()
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({
      ok: true,
      status: "healthy",
      aiProvider: env.AI_PROVIDER,
      aiModel: env.AI_MODEL,
      time: new Date().toISOString()
    });
  });

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/playlists", playlistRoutes);
  app.use("/api/progress", progressRoutes);
  app.use("/api/videos", videoRoutes);
  app.use("/api/notes", noteRoutes);
  app.use("/api/bookmarks", bookmarkRoutes);
  app.use("/api/transcripts", transcriptRoutes);
  app.use("/api/ai", aiLimiter, aiRoutes);
  app.use("/api/planner", plannerRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/revision", revisionRoutes);
  app.use("/api/certificates", certificateRoutes);
  app.use("/api/community", communityRoutes);
  app.use("/api/activity", activityRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/timetable", timetableRoutes);
  app.use("/api/coding", codingRoutes);

  // legacy compatibility route
  app.post("/api/playlist", async (req, res) => {
    try {
      const { getPlaylistVideos } = require("./services/youtubeService");
      const { playlistId, pageToken } = req.body || {};

      const result = await getPlaylistVideos(playlistId, pageToken);

      return res.json({
        ok: true,
        ...result
      });
    } catch (err) {
      const msg = youtubeErrorToMessage(err);

      console.error("Playlist fetch error:", err?.response?.data || err.message);

      return res.status(500).json({
        ok: false,
        error: "Failed to fetch playlist",
        details: msg
      });
    }
  });

  app.use((req, res) => {
    return res.status(404).json({
      ok: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = createApp;