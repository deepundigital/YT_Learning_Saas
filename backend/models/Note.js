const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
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
      default: "",
      trim: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    timestampSec: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    },
    type: {
      type: String,
      enum: ["manual", "summary", "revision"],
      default: "manual"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Note", noteSchema);