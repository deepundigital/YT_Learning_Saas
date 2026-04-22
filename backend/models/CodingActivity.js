const mongoose = require("mongoose");

const codingActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: String,
    required: true,
    // Format: 'YYYY-MM-DD'
  },
  platform: {
    type: String,
    required: true,
    enum: ["leetcode", "codeforces", "codechef", "tuf"]
  },
  solved: {
    type: Boolean,
    default: false
  },
  problemsCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Ensure unique entry per user per platform per day
codingActivitySchema.index({ user: 1, date: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model("CodingActivity", codingActivitySchema);
