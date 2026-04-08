const mongoose = require("mongoose");

const transcriptChunkSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },
    start: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const transcriptSchema = new mongoose.Schema(
  {
    youtubeId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    language: {
      type: String,
      default: "unknown"
    },
    chunks: {
      type: [transcriptChunkSchema],
      default: []
    },
    rawText: {
      type: String,
      default: ""
    },
    source: {
      type: String,
      default: "youtube"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Transcript", transcriptSchema);