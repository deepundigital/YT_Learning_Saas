const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
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
    label: {
      type: String,
      required: true,
      trim: true
    },
    note: {
      type: String,
      default: "",
      trim: true
    },
    timestampSec: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Bookmark", bookmarkSchema);