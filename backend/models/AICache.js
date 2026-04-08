const mongoose = require("mongoose");

const aiCacheSchema = new mongoose.Schema(
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
    cacheType: {
      type: String,
      enum: ["summary", "flashcards"],
      required: true,
      index: true
    },
    source: {
      type: String,
      default: "metadata-only"
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

aiCacheSchema.index({ user: 1, youtubeId: 1, cacheType: 1 }, { unique: true });

module.exports =
  mongoose.models.AICache || mongoose.model("AICache", aiCacheSchema);