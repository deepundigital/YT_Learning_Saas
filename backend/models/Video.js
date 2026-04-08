const mongoose = require("mongoose");

const flashcardSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const videoSchema = new mongoose.Schema(
  {
    youtubeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    channelTitle: {
      type: String,
      default: "",
      trim: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    thumbnails: {
      default: {
        type: String,
        default: "",
      },
      medium: {
        type: String,
        default: "",
      },
      high: {
        type: String,
        default: "",
      },
    },

    duration: {
      type: String,
      default: "",
    },

    durationSec: {
      type: Number,
      default: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    metadataFetchedAt: {
      type: Date,
      default: null,
    },

    transcriptText: {
      type: String,
      default: "",
    },

    transcriptSource: {
      type: String,
      default: "",
    },

    transcriptFetchedAt: {
      type: Date,
      default: null,
    },

    aiSummary: {
      type: String,
      default: "",
    },

    aiSummarySource: {
      type: String,
      default: "",
    },

    aiSummaryUpdatedAt: {
      type: Date,
      default: null,
    },

    flashcards: {
      type: [flashcardSchema],
      default: [],
    },

    flashcardsUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema);