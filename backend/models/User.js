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
    },
    level: {
      type: Number,
      default: 0
    },
    unlockedFeatures: {
      communityAccess: { type: Boolean, default: false },
      directConnect: { type: Boolean, default: false }
    }
  },
  {
    timestamps: true
  }
);

userSchema.methods.updateLevel = function() {
  const streak = this.stats?.streakDays || 0;
  if (streak >= 20) {
    this.level = 2;
    this.unlockedFeatures.communityAccess = true;
    this.unlockedFeatures.directConnect = true;
  } else if (streak >= 10) {
    this.level = 1;
    this.unlockedFeatures.communityAccess = true;
    this.unlockedFeatures.directConnect = false;
  } else {
    this.level = 0;
    this.unlockedFeatures.communityAccess = false;
    this.unlockedFeatures.directConnect = false;
  }
  return this.save();
};



module.exports = mongoose.model("User", userSchema);