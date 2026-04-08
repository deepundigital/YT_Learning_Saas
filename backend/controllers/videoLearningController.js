const videoLearningService = require("../services/videoLearningService");

function sanitizeYoutubeId(raw) {
  if (!raw) return "";
  return String(raw).trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

async function getVideoLearningPack(req, res, next) {
  try {
    const youtubeId = sanitizeYoutubeId(req.body?.youtubeId);

    if (!youtubeId) {
      return res.status(400).json({
        ok: false,
        error: "youtubeId is required"
      });
    }

    const result = await videoLearningService.generateVideoLearningPack(youtubeId);

    return res.status(200).json({
      ok: true,
      source: result.source,
      video: result.video,
      summary: result.summary,
      notes: result.notes,
      quiz: result.quiz
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getVideoLearningPack
};