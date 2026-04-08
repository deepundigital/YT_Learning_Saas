const mongoose = require("mongoose");

const revisionItemSchema = new mongoose.Schema(
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
    itemType: {
      type: String,
      enum: ["flashcard", "note", "bookmark", "custom"],
      default: "flashcard",
      index: true
    },
    prompt: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      default: "",
      trim: true
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium"
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    lastReviewedAt: {
      type: Date,
      default: null
    },
    nextReviewAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

revisionItemSchema.index(
  { user: 1, youtubeId: 1, itemType: 1, prompt: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.RevisionItem ||
  mongoose.model("RevisionItem", revisionItemSchema);