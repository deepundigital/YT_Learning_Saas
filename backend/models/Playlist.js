const mongoose = require("mongoose");

const playlistVideoSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    thumbnail: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const playlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    sourcePlaylistId: {
      type: String,
      default: ""
    },
    videos: {
      type: [playlistVideoSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Playlist", playlistSchema);