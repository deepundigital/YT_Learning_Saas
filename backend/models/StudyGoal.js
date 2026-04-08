const mongoose = require("mongoose");

const studyGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    youtubeIds: {
      type: [String],
      default: []
    },
    targetDate: {
      type: Date,
      default: null
    },
    dailyMinutes: {
      type: Number,
      default: 30
    },
    status: {
      type: String,
      enum: ["active", "completed", "paused"],
      default: "active",
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("StudyGoal", studyGoalSchema);