const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    code: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    icon: {
      type: String,
      default: "🏆"
    },
    category: {
      type: String,
      enum: ["watch", "playlist", "quiz", "streak", "certificate", "special"],
      default: "special"
    },
    xpReward: {
      type: Number,
      default: 0
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

achievementSchema.index({ user: 1, code: 1 }, { unique: true });
achievementSchema.index({ user: 1, earnedAt: -1 });

module.exports = mongoose.model("Achievement", achievementSchema);