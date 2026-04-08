const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    source: {
      type: String,
      default: "metadata-only"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
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
    title: {
      type: String,
      default: ""
    },
    messages: {
      type: [chatMessageSchema],
      default: []
    },
    lastSource: {
      type: String,
      default: "metadata-only"
    }
  },
  {
    timestamps: true
  }
);

chatSessionSchema.index({ user: 1, youtubeId: 1 }, { unique: true });

module.exports = mongoose.model("ChatSession", chatSessionSchema);