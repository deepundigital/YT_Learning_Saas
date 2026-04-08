const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true
    },
    options: {
      type: [String],
      default: []
    },
    selectedAnswer: {
      type: String,
      default: ""
    },
    correctAnswer: {
      type: String,
      default: ""
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    explanation: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null
    },
    playlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Playlist",
      default: null
    },
    title: {
      type: String,
      default: "Quiz Attempt"
    },
    sourceType: {
      type: String,
      enum: ["ai", "manual", "revision"],
      default: "ai"
    },
    answers: {
      type: [answerSchema],
      default: []
    },
    totalQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    scorePercent: {
      type: Number,
      default: 0
    },
    passed: {
      type: Boolean,
      default: false
    },
    attemptedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

quizAttemptSchema.index({ user: 1, attemptedAt: -1 });
quizAttemptSchema.index({ user: 1, video: 1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);