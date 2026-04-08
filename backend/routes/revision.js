const express = require("express");
const auth = require("../middleware/auth");
const validateYouTubeId = require("../middleware/validateYouTubeId");

const RevisionItem = require("../models/RevisionItem");
const Note = require("../models/Note");
const Bookmark = require("../models/Bookmark");

const router = express.Router();

function getUserId(req) {
  return req.user.userId || req.user.id;
}

function sanitizeVideoId(raw) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9_-]/g, "");
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function computeNextReview({ difficulty, reviewCount }) {
  const count = Number(reviewCount) || 0;

  if (difficulty === "easy") {
    const days = count <= 1 ? 3 : count <= 3 ? 7 : 14;
    return addDays(new Date(), days);
  }

  if (difficulty === "hard") {
    const days = count <= 1 ? 1 : 2;
    return addDays(new Date(), days);
  }

  const days = count <= 1 ? 2 : count <= 3 ? 4 : 7;
  return addDays(new Date(), days);
}

////////////////////////////////////////////////////
//////////// CREATE / UPDATE REVIEW ITEM ///////////
////////////////////////////////////////////////////

router.post("/review", auth, async (req, res) => {
  try {
    const {
      youtubeId,
      itemType = "flashcard",
      prompt,
      answer = "",
      difficulty = "medium"
    } = req.body || {};

    const cleanYoutubeId = sanitizeVideoId(youtubeId);

    if (!cleanYoutubeId) {
      return res.status(400).json({
        ok: false,
        error: "youtubeId is required"
      });
    }

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        ok: false,
        error: "prompt is required"
      });
    }

    const userId = getUserId(req);

    let item = await RevisionItem.findOne({
      user: userId,
      youtubeId: cleanYoutubeId,
      itemType,
      prompt: String(prompt).trim()
    });

    if (!item) {
      item = await RevisionItem.create({
        user: userId,
        youtubeId: cleanYoutubeId,
        itemType,
        prompt: String(prompt).trim(),
        answer: String(answer).trim(),
        difficulty,
        reviewCount: 1,
        lastReviewedAt: new Date(),
        nextReviewAt: computeNextReview({
          difficulty,
          reviewCount: 1
        })
      });
    } else {
      item.answer = String(answer).trim() || item.answer;
      item.difficulty = difficulty;
      item.reviewCount += 1;
      item.lastReviewedAt = new Date();
      item.nextReviewAt = computeNextReview({
        difficulty,
        reviewCount: item.reviewCount
      });

      await item.save();
    }

    return res.json({
      ok: true,
      item
    });

  } catch (err) {
    console.error("Revision review error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to save revision review",
      details: err.message
    });
  }
});

////////////////////////////////////////////////////
/////////// CREATE REVISION FROM NOTES /////////////
////////////////////////////////////////////////////

router.post(
  "/from-notes/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {
    try {

      const youtubeId = sanitizeVideoId(req.params.youtubeId);
      const userId = getUserId(req);

      const notes = await Note.find({
        user: userId,
        youtubeId
      });

      let created = 0;

      for (const note of notes) {

        const prompt =
          String(note.title || "").trim() ||
          `Revise note at ${note.timestampSec || 0}s`;

        const answer = String(note.content || "").trim();

        if (!answer) continue;

        await RevisionItem.findOneAndUpdate(
          {
            user: userId,
            youtubeId,
            itemType: "note",
            prompt
          },
          {
            $set: {
              answer,
              difficulty: "medium",
              nextReviewAt: addDays(new Date(), 2)
            },
            $setOnInsert: {
              reviewCount: 0,
              lastReviewedAt: null
            }
          },
          { upsert: true }
        );

        created++;
      }

      return res.json({
        ok: true,
        notesFound: notes.length,
        revisionItemsCreated: created
      });

    } catch (err) {
      console.error("Revision notes error:", err.message);

      return res.status(500).json({
        ok: false,
        error: "Failed to create revision items from notes",
        details: err.message
      });
    }
  }
);

////////////////////////////////////////////////////
//////// CREATE REVISION FROM BOOKMARKS ////////////
////////////////////////////////////////////////////

router.post(
  "/from-bookmarks/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {

    try {

      const youtubeId = sanitizeVideoId(req.params.youtubeId);
      const userId = getUserId(req);

      const bookmarks = await Bookmark.find({
        user: userId,
        youtubeId
      });

      let created = 0;

      for (const bm of bookmarks) {

        const prompt = `Revise concept at ${bm.timestampSec}s`;

        const answer =
          String(bm.note || "").trim() ||
          String(bm.label || "").trim() ||
          "Important moment in video";

        await RevisionItem.findOneAndUpdate(
          {
            user: userId,
            youtubeId,
            itemType: "bookmark",
            prompt
          },
          {
            $set: {
              answer,
              difficulty: "medium",
              nextReviewAt: addDays(new Date(), 2)
            },
            $setOnInsert: {
              reviewCount: 0,
              lastReviewedAt: null
            }
          },
          { upsert: true }
        );

        created++;
      }

      return res.json({
        ok: true,
        bookmarksFound: bookmarks.length,
        revisionItemsCreated: created
      });

    } catch (err) {

      console.error("Revision bookmarks error:", err.message);

      return res.status(500).json({
        ok: false,
        error: "Failed to create revision items from bookmarks",
        details: err.message
      });
    }
  }
);

////////////////////////////////////////////////////
//////////////////// TODAY /////////////////////////
////////////////////////////////////////////////////

router.get("/today", auth, async (req, res) => {

  try {

    const now = new Date();

    const items = await RevisionItem.find({
      user: getUserId(req),
      nextReviewAt: { $lte: now }
    }).sort({ nextReviewAt: 1 });

    return res.json({
      ok: true,
      items
    });

  } catch (err) {

    console.error("Today revision error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to fetch today's revisions",
      details: err.message
    });
  }
});

////////////////////////////////////////////////////
///////////// REVISION ITEMS BY VIDEO //////////////
////////////////////////////////////////////////////

router.get(
  "/video/:youtubeId",
  auth,
  validateYouTubeId("youtubeId"),
  async (req, res) => {

    try {

      const youtubeId = sanitizeVideoId(req.params.youtubeId);

      const items = await RevisionItem.find({
        user: getUserId(req),
        youtubeId
      }).sort({ nextReviewAt: 1 });

      return res.json({
        ok: true,
        items
      });

    } catch (err) {

      console.error("Video revision error:", err.message);

      return res.status(500).json({
        ok: false,
        error: "Failed to fetch video revisions",
        details: err.message
      });
    }
  }
);

module.exports = router;