const express = require("express");
const auth = require("../middleware/auth");
const validateYouTubeId = require("../middleware/validateYouTubeId");

const Video = require("../models/Video");
const Transcript = require("../models/Transcript");
const AIInteraction = require("../models/AIInteraction");
const ChatSession = require("../models/ChatSession");
const FlashcardSet = require("../models/FlashcardSet");
const RevisionItem = require("../models/RevisionItem");
const AICache = require("../models/AICache");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const upload = multer({ storage: multer.memoryStorage() });


const { getVideoMetadata } = require("../services/youtubeService");
const {
  generateVideoSummary,
  askVideoQuestion,
  generateVideoQuiz,
  chatWithVideo,
  generateFlashcards,
  solveAssignment
} = require("../services/ai/aiProvider");

const {
  normalizeSummary,
  normalizeAsk,
} = require("../services/ai/formatters");

const router = express.Router();

function sanitizeVideoId(raw) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function getUserId(req) {
  return req.user.userId || req.user.id;
}

function safeJsonParse(text) {
  if (!text) return null;

  const raw = String(text).trim();

  try {
    return JSON.parse(raw);
  } catch {}

  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch {}
  }

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = raw.slice(firstBrace, lastBrace + 1).trim();
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  return null;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function initialNextReviewAt() {
  return addDays(new Date(), 2);
}

function shouldForceRefresh(req) {
  return (
    req.body?.forceRefresh === true ||
    String(req.query.forceRefresh || "").toLowerCase() === "true"
  );
}

async function getOrCreateVideo(youtubeId) {
  let video = await Video.findOne({ youtubeId });
  if (video) return video;

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
    metadataFetchedAt: new Date(),
  });

  return video;
}

async function getBestTranscriptText(youtubeId, video = null) {
  const transcriptDoc = await Transcript.findOne({ youtubeId });

  if (transcriptDoc?.rawText) {
    return {
      text: transcriptDoc.rawText,
      source: "transcript+metadata",
      transcriptAvailable: true,
    };
  }

  if (video?.transcriptText) {
    return {
      text: video.transcriptText,
      source: "transcript+metadata",
      transcriptAvailable: true,
    };
  }

  return {
    text: "",
    source: "metadata-only",
    transcriptAvailable: false,
  };
}

async function upsertRevisionItemsFromFlashcards({
  userId,
  youtubeId,
  cards = [],
}) {
  let createdOrUpdated = 0;

  for (const card of cards) {
    const prompt = String(card?.question || "").trim();
    const answer = String(card?.answer || "").trim();

    if (!prompt) continue;

    await RevisionItem.findOneAndUpdate(
      {
        user: userId,
        youtubeId,
        itemType: "flashcard",
        prompt,
      },
      {
        $set: {
          answer,
          difficulty: "medium",
          nextReviewAt: initialNextReviewAt(),
        },
        $setOnInsert: {
          reviewCount: 0,
          lastReviewedAt: null,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    createdOrUpdated += 1;
  }

  return createdOrUpdated;
}

router.post(
  "/summary/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {
      const youtubeId = sanitizeVideoId(req.params.youtubeId);
      const userId = getUserId(req);
      const forceRefresh = shouldForceRefresh(req);

      if (!forceRefresh) {
        const cached = await AICache.findOne({
          user: userId,
          youtubeId,
          cacheType: "summary",
        });

        if (cached) {
          return res.json({
            ok: true,
            source: cached.source,
            cacheHit: true,
            summary: cached.payload,
          });
        }
      }

      const video = await getOrCreateVideo(youtubeId);
      const transcriptData = await getBestTranscriptText(youtubeId, video);

      const result = await generateVideoSummary({
        video,
        transcriptText: transcriptData.text,
      });

      const normalized = normalizeSummary(result.raw);

      await AICache.findOneAndUpdate(
        { user: userId, youtubeId, cacheType: "summary" },
        {
          source: transcriptData.source,
          payload: normalized,
        },
        { new: true, upsert: true }
      );

      await AIInteraction.create({
        user: userId,
        youtubeId,
        type: "summary",
        input: { forceRefresh },
        output: normalized,
        source: transcriptData.source,
      });

      return res.json({
        ok: true,
        source: transcriptData.source,
        transcriptAvailable: transcriptData.transcriptAvailable,
        cacheHit: false,
        summary: normalized,
      });
    } catch (err) {
      console.error("AI summary error:", err.response?.data || err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to generate AI summary",
        details: err.response?.data || err.message,
      });
    }
  }
);

router.post(
  "/ask/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {
      const youtubeId = sanitizeVideoId(req.params.youtubeId);
      const question = String(req.body?.question || "").trim();

      if (!question) {
        return res.status(400).json({
          ok: false,
          error: "question is required",
        });
      }

      const video = await getOrCreateVideo(youtubeId);
      const transcriptData = await getBestTranscriptText(youtubeId, video);

      const result = await askVideoQuestion({
        video,
        transcriptText: transcriptData.text,
        question,
      });

      const normalized = normalizeAsk(result.raw);

      await AIInteraction.create({
        user: getUserId(req),
        youtubeId,
        type: "ask",
        input: { question },
        output: normalized,
        source: transcriptData.source,
      });

      return res.json({
        ok: true,
        source: transcriptData.source,
        transcriptAvailable: transcriptData.transcriptAvailable,
        question,
        answer: normalized,
      });
    } catch (err) {
      console.error("AI ask error:", err.response?.data || err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to answer video question",
        details: err.response?.data || err.message,
      });
    }
  }
);

router.post(
  "/quiz/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {
      const youtubeId = sanitizeVideoId(req.params.youtubeId);
      const count = Math.max(1, Math.min(Number(req.body?.count) || 5, 10));

      const video = await getOrCreateVideo(youtubeId);
      const transcriptData = await getBestTranscriptText(youtubeId, video);

      const quiz = await generateVideoQuiz({
        video,
        transcriptText: transcriptData.text,
        count,
      });

      const parsed = safeJsonParse(quiz.raw);
      const output =
        parsed && Array.isArray(parsed.questions)
          ? parsed
          : {
              raw: quiz.raw,
              warning: "Quiz returned but could not be parsed as strict JSON",
            };

      await AIInteraction.create({
        user: getUserId(req),
        youtubeId,
        type: "quiz",
        input: { count },
        output,
        source: transcriptData.source,
      });

      return res.json({
        ok: true,
        source: transcriptData.source,
        transcriptAvailable: transcriptData.transcriptAvailable,
        quiz: output,
      });
    } catch (err) {
      console.error("AI quiz error:", err.response?.data || err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to generate quiz",
        details: err.response?.data || err.message,
      });
    }
  }
);

router.post(
  "/chat/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {
      const youtubeId = sanitizeVideoId(req.params.youtubeId);
      const question = String(req.body?.question || "").trim();

      if (!question) {
        return res.status(400).json({
          ok: false,
          error: "question is required",
        });
      }

      const userId = getUserId(req);
      const video = await getOrCreateVideo(youtubeId);
      const transcriptData = await getBestTranscriptText(youtubeId, video);

      let session = await ChatSession.findOne({ user: userId, youtubeId });

      if (!session) {
        session = await ChatSession.create({
          user: userId,
          youtubeId,
          title: video.title || "Video Chat",
          messages: [],
        });
      }

      const history = session.messages.slice(-8).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const result = await chatWithVideo({
        video,
        transcriptText: transcriptData.text,
        history,
        question,
      });

      const normalized = normalizeAsk(result.raw);

      session.lastSource = transcriptData.source;
      session.messages.push({
        role: "user",
        content: question,
        source: transcriptData.source,
      });
      session.messages.push({
        role: "assistant",
        content: normalized.answer || result.raw,
        source: transcriptData.source,
      });

      if (session.messages.length > 40) {
        session.messages = session.messages.slice(-40);
      }

      await session.save();

      await AIInteraction.create({
        user: userId,
        youtubeId,
        type: "ask",
        input: { question, mode: "chat" },
        output: normalized,
        source: transcriptData.source,
      });

      return res.json({
        ok: true,
        source: transcriptData.source,
        transcriptAvailable: transcriptData.transcriptAvailable,
        sessionId: session._id,
        message: normalized,
      });
    } catch (err) {
      console.error("AI chat error:", err.response?.data || err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to chat with AI tutor",
        details: err.response?.data || err.message,
      });
    }
  }
);

router.get(
  "/chat/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {
      const youtubeId = sanitizeVideoId(req.params.youtubeId);
      const session = await ChatSession.findOne({
        user: getUserId(req),
        youtubeId,
      });

      return res.json({
        ok: true,
        session: session || null,
      });
    } catch (err) {
      console.error("Get AI chat error:", err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch AI chat session",
        details: err.message,
      });
    }
  }
);

router.delete(
  "/chat/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {
      const youtubeId = sanitizeVideoId(req.params.youtubeId);

      await ChatSession.findOneAndDelete({
        user: getUserId(req),
        youtubeId,
      });

      return res.json({
        ok: true,
        message: "Chat session cleared successfully",
      });
    } catch (err) {
      console.error("Delete AI chat error:", err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to clear AI chat session",
        details: err.message,
      });
    }
  }
);

router.post(
  "/flashcards/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {
      const youtubeId = sanitizeVideoId(req.params.youtubeId);
      const userId = getUserId(req);
      const count = Math.max(1, Math.min(Number(req.body?.count) || 8, 20));
      const forceRefresh = shouldForceRefresh(req);

      if (!forceRefresh) {
        const cached = await AICache.findOne({
          user: userId,
          youtubeId,
          cacheType: "flashcards",
        });

        if (cached) {
          const savedSet = await FlashcardSet.findOne({
            user: userId,
            youtubeId,
          });

          return res.json({
            ok: true,
            source: cached.source,
            cacheHit: true,
            flashcards: cached.payload,
            savedSet: savedSet || null,
            revisionItemsCreated: 0,
          });
        }
      }

      const video = await getOrCreateVideo(youtubeId);
      const transcriptData = await getBestTranscriptText(youtubeId, video);

      const result = await generateFlashcards({
        video,
        transcriptText: transcriptData.text,
        count,
      });

      const parsed = safeJsonParse(result.raw);
      const output =
        parsed && Array.isArray(parsed.cards)
          ? { cards: parsed.cards }
          : {
              raw: result.raw,
              warning:
                "Flashcards returned but could not be parsed as strict JSON",
            };

      const set = await FlashcardSet.findOneAndUpdate(
        { user: userId, youtubeId },
        {
          title: video.title || "Flashcards",
          source: transcriptData.source,
          cards: Array.isArray(output.cards) ? output.cards : [],
        },
        { new: true, upsert: true }
      );

      await AICache.findOneAndUpdate(
        { user: userId, youtubeId, cacheType: "flashcards" },
        {
          source: transcriptData.source,
          payload: output,
        },
        { new: true, upsert: true }
      );

      let revisionItemsCreated = 0;
      if (Array.isArray(output.cards) && output.cards.length) {
        revisionItemsCreated = await upsertRevisionItemsFromFlashcards({
          userId,
          youtubeId,
          cards: output.cards,
        });
      }

      await AIInteraction.create({
        user: userId,
        youtubeId,
        type: "quiz",
        input: { count, mode: "flashcards", forceRefresh },
        output,
        source: transcriptData.source,
      });

      return res.json({
        ok: true,
        source: transcriptData.source,
        transcriptAvailable: transcriptData.transcriptAvailable,
        cacheHit: false,
        flashcards: output,
        savedSet: set,
        revisionItemsCreated,
      });
    } catch (err) {
      console.error("AI flashcards error:", err.response?.data || err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to generate flashcards",
        details: err.response?.data || err.message,
      });
    }
  }
);

router.get(
  "/flashcards/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {
      const youtubeId = sanitizeVideoId(req.params.youtubeId);

      const set = await FlashcardSet.findOne({
        user: getUserId(req),
        youtubeId,
      });

      return res.json({
        ok: true,
        flashcards: set || null,
      });
    } catch (err) {
      console.error("Get flashcards error:", err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch flashcards",
        details: err.message,
      });
    }
  }
);

router.get("/history", auth, async (req, res) => {
  try {
    const items = await AIInteraction.find({ user: getUserId(req) })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      ok: true,
      items,
    });
  } catch (err) {
    console.error("AI history error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch AI history",
      details: err.message,
    });
  }
});

router.get(
  "/history/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {
      const youtubeId = sanitizeVideoId(req.params.youtubeId);

      const items = await AIInteraction.find({
        user: getUserId(req),
        youtubeId,
      }).sort({ createdAt: -1 });

      return res.json({
        ok: true,
        items,
      });
    } catch (err) {
      console.error("AI video history error:", err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch video AI history",
        details: err.message,
      });
    }
  }
);
const QuizAttempt = require("../models/QuizAttempt");

// Save quiz attempt
router.post("/quiz-attempt", auth, async (req, res) => {
  try {
    const userId = getUserId(req);

    const {
      youtubeId,
      playlistId = null,
      title = "Quiz Attempt",
      answers = [],
    } = req.body || {};

    if (!youtubeId) {
      return res.status(400).json({
        ok: false,
        error: "youtubeId is required",
      });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "answers array is required",
      });
    }

    const video = await Video.findOne({ youtubeId });

    const normalizedAnswers = answers.map((item) => {
      const question = String(item?.question || "").trim();
      const options = Array.isArray(item?.options) ? item.options : [];
      const selectedAnswer = String(item?.selectedAnswer || "").trim();
      const correctAnswer = String(
        item?.correctAnswer || item?.answer || ""
      ).trim();
      const explanation = String(item?.explanation || "").trim();

      const isCorrect =
        selectedAnswer &&
        correctAnswer &&
        selectedAnswer.toLowerCase() === correctAnswer.toLowerCase();

      return {
        question,
        options,
        selectedAnswer,
        correctAnswer,
        isCorrect,
        explanation,
      };
    });

    const totalQuestions = normalizedAnswers.length;
    const correctAnswers = normalizedAnswers.filter((a) => a.isCorrect).length;
    const scorePercent =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    const attempt = await QuizAttempt.create({
      user: userId,
      video: video?._id || null,
      playlist: playlistId || null,
      title,
      sourceType: "ai",
      answers: normalizedAnswers,
      totalQuestions,
      correctAnswers,
      scorePercent,
      passed: scorePercent >= 40,
      attemptedAt: new Date(),
    });

    return res.status(201).json({
      ok: true,
      attempt,
    });
  } catch (err) {
    console.error("Save quiz attempt error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to save quiz attempt",
      details: err.message,
    });
  }
});

// Get all quiz attempts of current user
router.get("/quiz-attempts", auth, async (req, res) => {
  try {
    const userId = getUserId(req);

    const attempts = await QuizAttempt.find({ user: userId })
      .populate("video", "youtubeId title thumbnails")
      .sort({ attemptedAt: -1 })
      .limit(100);

    return res.json({
      ok: true,
      attempts,
    });
  } catch (err) {
    console.error("Get quiz attempts error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch quiz attempts",
      details: err.message,
    });
  }
});

// Get quiz attempts for a specific video
router.get("/quiz-attempts/:youtubeId", auth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const youtubeId = sanitizeVideoId(req.params.youtubeId);

    const video = await Video.findOne({ youtubeId });

    if (!video) {
      return res.json({
        ok: true,
        attempts: [],
      });
    }

    const attempts = await QuizAttempt.find({
      user: userId,
      video: video._id,
    })
      .sort({ attemptedAt: -1 })
      .limit(50);

    return res.json({
      ok: true,
      attempts,
    });
  } catch (err) {
    console.error("Get video quiz attempts error:", err.message);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch video quiz attempts",
      details: err.message,
    });
  }
});
router.post("/solve-assignment", auth, upload.single("assignment"), async (req, res) => {
  console.log("==== ASSIGNMENT SOLVER REQUEST ====");
  console.log("Body:", req.body);
  console.log("File Metadata:", req.file ? {
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size
  } : "No file uploaded");

  try {
    let content = req.body.content || "";
    const instructions = req.body.instructions || "";

    // 1. Process File if present
    if (req.file) {
      const mimeType = req.file.mimetype;
      
      if (mimeType === "application/pdf") {
        console.log("Status: Extracting text from PDF...");
        const pdfData = await pdfParse(req.file.buffer);
        content = pdfData.text;
        console.log("Success: PDF text extracted. Length:", content.length);
      } 
      else if (mimeType.startsWith("image/")) {
        console.log("Status: Image detected. Using fallback OCR note.");
        // Basic fallback as requested
        content = `[IMAGE ANALYSIS REQUESTED: ${req.file.originalname}] Please analyze the problem visible in the attached image content.`;
      } 
      else if (mimeType === "text/plain") {
        content = req.file.buffer.toString("utf-8");
      }
    }

    // 2. Validate Input
    if (!content.trim() && !instructions.trim()) {
      console.warn("Validation Error: Request contains no content or instructions.");
      return res.status(400).json({
        success: false,
        message: "Failed to solve assignment",
        error: "Please provide assignment content, a file, or specific instructions."
      });
    }

    const userId = getUserId(req);

    // 3. AI Processing
    console.log("Status: Sending to AI Provider...");
    const result = await solveAssignment({ content, instructions });

    if (!result || !result.raw) {
      throw new Error("Invalid AI response: Solution content is empty");
    }

    console.log("AI Response Preview:", result.raw.substring(0, 200) + "...");

    // 4. Activity Logging
    await AIInteraction.create({
      user: userId,
      type: "assignment",
      input: { 
        instructions, 
        hasFile: !!req.file,
        fileName: req.file?.originalname,
        contentLength: content.length 
      },
      output: { solution: result.raw },
      source: "upload",
    });

    console.log("Success: Assignment solved and logged.");

    return res.json({
      success: true,
      solution: result.raw,
    });

  } catch (error) {
    console.error("Assignment Solver Error:", error);
    console.error("Stack:", error.stack);
    
    return res.status(500).json({
      success: false,
      message: "Failed to solve assignment",
      error: error.message || "An internal error occurred while processing the assignment."
    });
  }
});

module.exports = router;