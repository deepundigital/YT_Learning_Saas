const express = require("express");
const auth = require("../middleware/auth");
const Transcript = require("../models/Transcript");
const Video = require("../models/Video");
const { getTranscript } = require("../services/transcriptService");

const router = express.Router();

function sanitizeVideoId(raw) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function shouldForceRefresh(req) {
  return (
    req.body?.forceRefresh === true ||
    String(req.query.forceRefresh || "").toLowerCase() === "true"
  );
}

function normalizeTranscriptPayload(videoId, fetched) {
  if (!fetched) return null;

  // New format
  if (fetched.rawText) {
    return {
      youtubeId: videoId,
      language: fetched.language || "unknown",
      chunks: Array.isArray(fetched.chunks) ? fetched.chunks : [],
      rawText: String(fetched.rawText || "").trim(),
      source: fetched.source || "youtube-transcript",
    };
  }

  // Old format compatibility
  if (fetched.ok && fetched.transcriptText) {
    return {
      youtubeId: videoId,
      language: fetched.language || "unknown",
      chunks: Array.isArray(fetched.transcriptItems)
        ? fetched.transcriptItems
            .map((item) => ({
              text: String(item?.text || "").trim(),
              start: Number(item?.offset || item?.start || 0),
              duration: Number(item?.duration || 0),
            }))
            .filter((item) => item.text)
        : [],
      rawText: String(fetched.transcriptText || "").trim(),
      source: fetched.source || "youtube-transcript",
    };
  }

  return null;
}

async function saveTranscriptToDb(videoId, normalized) {
  const savedTranscript = await Transcript.findOneAndUpdate(
    { youtubeId: videoId },
    {
      youtubeId: videoId,
      language: normalized.language || "unknown",
      chunks: Array.isArray(normalized.chunks) ? normalized.chunks : [],
      rawText: normalized.rawText || "",
      source: normalized.source || "manual",
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  await Video.findOneAndUpdate(
    { youtubeId: videoId },
    {
      $set: {
        transcriptText: normalized.rawText || "",
        transcriptSource: normalized.source || "manual",
        transcriptFetchedAt: new Date(),
      },
    }
  );

  return savedTranscript;
}

router.get("/:videoId", auth, async (req, res) => {
  try {
    const videoId = sanitizeVideoId(req.params.videoId);
    const forceRefresh = shouldForceRefresh(req);

    if (!videoId) {
      return res.status(400).json({
        ok: false,
        error: "Invalid videoId",
      });
    }

    const existing = await Transcript.findOne({ youtubeId: videoId });

    // Normal path: DB first
    if (!forceRefresh && existing) {
      return res.json({
        ok: true,
        source: "database",
        cacheHit: true,
        transcript: existing,
      });
    }

    // Refresh path: try fresh fetch first
    try {
      const fetched = await getTranscript(videoId);
      const normalized = normalizeTranscriptPayload(videoId, fetched);

      if (normalized && normalized.rawText) {
        const savedTranscript = await saveTranscriptToDb(videoId, normalized);

        return res.json({
          ok: true,
          source: normalized.source || "youtube-transcript",
          cacheHit: false,
          transcript: savedTranscript,
        });
      }
    } catch (fetchErr) {
      console.error("Transcript fetch failed, checking fallback:", fetchErr.message);
    }

    // Fallback: if fresh fetch failed but DB transcript exists, return it
    if (existing) {
      return res.json({
        ok: true,
        source: "database-fallback",
        cacheHit: true,
        transcript: existing,
        warning: "Fresh transcript fetch failed, returned saved transcript instead",
      });
    }

    return res.status(404).json({
      ok: false,
      error: "Transcript not available for this video",
      details: "No fresh transcript fetched and no saved transcript found",
    });
  } catch (err) {
    console.error("Transcript error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to fetch transcript",
      details: err.message || "Unknown error",
    });
  }
});

router.post("/:videoId/import", auth, async (req, res) => {
  try {
    const videoId = sanitizeVideoId(req.params.videoId);
    const language = String(req.body?.language || "manual").trim();
    const rawText = String(req.body?.rawText || "").trim();

    if (!videoId) {
      return res.status(400).json({
        ok: false,
        error: "Invalid videoId",
      });
    }

    if (!rawText) {
      return res.status(400).json({
        ok: false,
        error: "rawText is required",
      });
    }

    const chunks = rawText
      .split(/\n+/)
      .map((line) => String(line || "").trim())
      .filter(Boolean)
      .map((text, index) => ({
        text,
        start: index * 5,
        duration: 5,
      }));

    const normalized = {
      youtubeId: videoId,
      language,
      chunks,
      rawText,
      source: "manual-import",
    };

    const savedTranscript = await saveTranscriptToDb(videoId, normalized);

    return res.status(201).json({
      ok: true,
      source: "manual-import",
      transcript: savedTranscript,
    });
  } catch (err) {
    console.error("Manual transcript import error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to import transcript",
      details: err.message || "Unknown error",
    });
  }
});

module.exports = router;