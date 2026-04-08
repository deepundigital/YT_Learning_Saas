const Video = require("../models/Video");
const youtubeService = require("./youtubeService");
const aiService = require("./aiService");

function buildLearningTextFromVideo(video) {
  const parts = [
    `Title: ${video.title || ""}`,
    `Channel: ${video.channelTitle || ""}`,
    `Description: ${video.description || ""}`
  ].filter(Boolean);

  return parts.join("\n\n");
}

async function ensureVideoByYoutubeId(youtubeId) {
  let video = await Video.findOne({ youtubeId });

  if (video) {
    return {
      source: "database",
      video
    };
  }

  const metadata = await youtubeService.getVideoMetadata(youtubeId);

  video = await Video.create({
    youtubeId: metadata.youtubeId,
    title: metadata.title,
    description: metadata.description,
    channelTitle: metadata.channelTitle,
    thumbnails: metadata.thumbnails,
    durationSec: metadata.durationSec,
    publishedAt: metadata.publishedAt
  });

  return {
    source: "youtube",
    video
  };
}

function normalizeQuizResult(rawQuiz) {
  if (Array.isArray(rawQuiz)) {
    return rawQuiz;
  }

  if (typeof rawQuiz === "string") {
    try {
      return JSON.parse(rawQuiz);
    } catch (error) {
      return rawQuiz;
    }
  }

  return rawQuiz;
}

async function generateVideoLearningPack(youtubeId) {
  const ensured = await ensureVideoByYoutubeId(youtubeId);
  const video = ensured.video;

  const learningText = buildLearningTextFromVideo(video);

  const [summaryOutput, notesOutput, quizOutput] = await Promise.all([
    aiService.generateSummary(learningText),
    aiService.generateNotes(learningText),
    aiService.generateQuiz(learningText)
  ]);

  return {
    source: ensured.source,
    video,
    learningText,
    summary: {
      provider: summaryOutput.provider,
      fallbackUsed: summaryOutput.fallbackUsed,
      content: summaryOutput.result,
      originalError: summaryOutput.originalError || null
    },
    notes: {
      provider: notesOutput.provider,
      fallbackUsed: notesOutput.fallbackUsed,
      content: notesOutput.result,
      originalError: notesOutput.originalError || null
    },
    quiz: {
      provider: quizOutput.provider,
      fallbackUsed: quizOutput.fallbackUsed,
      content: normalizeQuizResult(quizOutput.result),
      raw: quizOutput.result,
      originalError: quizOutput.originalError || null
    }
  };
}

module.exports = {
  ensureVideoByYoutubeId,
  buildLearningTextFromVideo,
  generateVideoLearningPack
};