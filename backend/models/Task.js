const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  date: {
    type: String,
    required: true,
    description: "YYYY-MM-DD",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

TaskSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model("Task", TaskSchema);
