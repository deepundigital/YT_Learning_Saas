const mongoose = require("mongoose");

const UserActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String,
    required: true,
    description: "YYYY-MM-DD",
  },
  tasksCompleted: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to quickly find a user's activity for a specific date
UserActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("UserActivity", UserActivitySchema);
