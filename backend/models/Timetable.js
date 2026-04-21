const mongoose = require("mongoose");

const TimetableSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
    description: "0=Sunday, 6=Saturday",
  },
  subject: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
    description: "HH:mm format",
  },
  endTime: {
    type: String,
    required: true,
    description: "HH:mm format",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

TimetableSchema.index({ userId: 1, dayOfWeek: 1 });

module.exports = mongoose.model("Timetable", TimetableSchema);
