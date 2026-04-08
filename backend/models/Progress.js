const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    videoId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      default: ""
    },
    watchTimeSec: {
      type: Number,
      default: 0
    },
    lastPositionSec: {
      type: Number,
      default: 0
    },
    maxPositionSec: {
      type: Number,
      default: 0
    },
    durationSec: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

progressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);