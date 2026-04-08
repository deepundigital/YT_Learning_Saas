const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    passwordHash: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      default: "",
      maxlength: 300
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system"
      },
      accentColor: {
        type: String,
        default: "#7c3aed"
      },
      dashboardLayout: {
        type: String,
        enum: ["default", "compact", "focus"],
        default: "default"
      },
      autoplay: {
        type: Boolean,
        default: true
      },
      emailNotifications: {
        type: Boolean,
        default: false
      }
    },
    stats: {
      totalWatchTimeSec: {
        type: Number,
        default: 0
      },
      completedVideos: {
        type: Number,
        default: 0
      },
      completedPlaylists: {
        type: Number,
        default: 0
      },
      streakDays: {
        type: Number,
        default: 0
      },
      xp: {
        type: Number,
        default: 0
      },
      googleId: {
  type: String,
  default: null,
},
authProvider: {
  type: String,
  enum: ["local", "google"],
  default: "local",
},
resetPasswordToken: {
  type: String,
  default: null,
},
resetPasswordExpires: {
  type: Date,
  default: null,
},
lastLoginAt: {
  type: Date,
  default: null,
},
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
  
);



module.exports = mongoose.model("User", userSchema);