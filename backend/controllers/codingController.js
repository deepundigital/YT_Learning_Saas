const User = require("../models/User");
const CodingActivity = require("../models/CodingActivity");
const {
  fetchLeetCodeStats,
  fetchCodeforcesStats,
  fetchCodeChefStats,
  fetchContests
} = require("../services/codingService");

const getTodayDateString = () => new Date().toISOString().split("T")[0];

exports.updateProfiles = async (req, res, next) => {
  try {
    const { leetcode, codeforces, codechef, tuf } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    user.codingProfiles = {
      leetcode: leetcode !== undefined ? leetcode : user.codingProfiles?.leetcode,
      codeforces: codeforces !== undefined ? codeforces : user.codingProfiles?.codeforces,
      codechef: codechef !== undefined ? codechef : user.codingProfiles?.codechef,
      tuf: tuf !== undefined ? tuf : user.codingProfiles?.tuf
    };

    await user.save();
    res.status(200).json({ ok: true, codingProfiles: user.codingProfiles });
  } catch (error) {
    next(error);
  }
};

exports.getTrackerStats = async (req, res, next) => {
  try {
    const userId = req.params.userId === "me" ? req.user._id : req.params.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const profiles = user.codingProfiles || {};
    
    const [leetcodeStats, codeforcesStats, codechefStats] = await Promise.all([
      profiles.leetcode ? fetchLeetCodeStats(profiles.leetcode) : null,
      profiles.codeforces ? fetchCodeforcesStats(profiles.codeforces) : null,
      profiles.codechef ? fetchCodeChefStats(profiles.codechef) : null
    ]);

    // Compute streak
    const activities = await CodingActivity.find({ user: userId }).sort({ date: -1 });
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (activities.length > 0) {
      const dates = activities.map(a => a.date);
      const uniqueDates = [...new Set(dates)].sort((a,b) => new Date(b) - new Date(a));
      
      const todayStr = getTodayDateString();
      let yesterday = new Date(todayStr);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        currentStreak = 1;
        let cursor = new Date(uniqueDates[0]);
        for (let i = 1; i < uniqueDates.length; i++) {
          cursor.setDate(cursor.getDate() - 1);
          if (uniqueDates[i] === cursor.toISOString().split("T")[0]) {
            currentStreak++;
          } else break;
        }
      }

      let tempStreak = 1;
      longestStreak = 1;
      let cursor = new Date(uniqueDates[0]);
      for (let i = 1; i < uniqueDates.length; i++) {
        let prev = new Date(cursor);
        prev.setDate(prev.getDate() - 1);
        if (uniqueDates[i] === prev.toISOString().split("T")[0]) {
          tempStreak++;
          cursor = new Date(uniqueDates[i]);
        } else {
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          tempStreak = 1;
          cursor = new Date(uniqueDates[i]);
        }
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    res.status(200).json({
      ok: true,
      profiles,
      stats: {
        leetcode: leetcodeStats,
        codeforces: codeforcesStats,
        codechef: codechefStats,
        tuf: profiles.tuf ? { platform: "tuf", link: profiles.tuf } : null
      },
      currentStreak,
      longestStreak
    });
  } catch (error) {
    next(error);
  }
};

exports.getTodayActivity = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const todayActivities = await CodingActivity.find({ user: req.user._id, date: today });

    const activityByPlatform = {};
    todayActivities.forEach(a => {
      activityByPlatform[a.platform] = true;
    });

    res.status(200).json({ ok: true, activityToday: activityByPlatform });
  } catch (error) {
    next(error);
  }
};

exports.markProblemSolved = async (req, res, next) => {
  try {
    const { platform } = req.body;
    if (!["leetcode", "codeforces", "codechef", "tuf"].includes(platform)) {
      return res.status(400).json({ ok: false, error: "Invalid platform" });
    }

    const today = getTodayDateString();
    
    const activity = await CodingActivity.findOneAndUpdate(
      { user: req.user._id, date: today, platform },
      { $set: { solved: true }, $inc: { problemsCount: 1 } },
      { new: true, upsert: true }
    );

    const io = req.app.get("io");
    if (io) {
      const userDoc = await User.findById(req.user._id).select("name avatar username");
      io.emit("activityUpdated", {
        userId: req.user._id,
        name: userDoc.name,
        avatar: userDoc.avatar,
        platform,
        problemsCount: activity.problemsCount
      });
      // also emit onlineUsers if needed, but handled by base socket usually
    }

    res.status(200).json({ ok: true, activity });
  } catch (error) {
    next(error);
  }
};

exports.getLeaderboard = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    const activities = await CodingActivity.find({ date: today }).populate("user", "name avatar username stats");
    
    const activeUsersMap = {};
    activities.forEach(a => {
      if (a.user) {
        const uid = a.user._id.toString();
        if (!activeUsersMap[uid]) {
          activeUsersMap[uid] = {
            user: a.user,
            platforms: [],
            streak: a.user.stats?.streakDays || 0
          };
        }
        activeUsersMap[uid].platforms.push(a.platform);
      }
    });

    const activeUsers = Object.values(activeUsersMap).sort((a,b) => b.platforms.length - a.platforms.length || b.streak - a.streak);

    res.status(200).json({
      ok: true,
      activeUsers,
      totalActive: activeUsers.length
    });
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingContests = async (req, res, next) => {
  try {
    const contests = await fetchContests();
    res.status(200).json({
      ok: true,
      contests
    });
  } catch (error) {
    next(error);
  }
};
