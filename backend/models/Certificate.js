const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    platform: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    type: {
      type: String,
      enum: ["platform", "external"],
      default: "external"
    },
    courseName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 180
    },
    issuedBy: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120
    },
    certificateId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    completionDate: {
      type: Date,
      required: true
    },
    fileUrl: {
      type: String,
      default: ""
    },
    verificationLink: {
      type: String,
      default: ""
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

certificateSchema.index({ user: 1, completionDate: -1 });

module.exports = mongoose.model("Certificate", certificateSchema);