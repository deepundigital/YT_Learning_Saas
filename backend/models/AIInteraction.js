const mongoose = require("mongoose");

const aiInteractionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    youtubeId: {
      type: String,
      required: false,
      index: true
    },
    type: {
      type: String,
      enum: ["summary", "ask", "quiz", "assignment"],
      required: true,
      index: true
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    source: {
      type: String,
      default: "metadata-only"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AIInteraction", aiInteractionSchema);