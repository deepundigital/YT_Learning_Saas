const mongoose = require("mongoose");

const flashcardSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const flashcardSetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    youtubeId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      default: ""
    },
    source: {
      type: String,
      default: "metadata-only"
    },
    cards: {
      type: [flashcardSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

flashcardSetSchema.index({ user: 1, youtubeId: 1 }, { unique: true });

module.exports = mongoose.models.FlashcardSet || mongoose.model("FlashcardSet", flashcardSetSchema);