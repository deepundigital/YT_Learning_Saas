const User = require("../models/User");
const CodingActivity = require("../models/CodingActivity");
const {
  fetchLeetCodeStats,
  fetchCodeforcesStats,
  fetchCodeChefStats,
  fetchGfgStats,
  fetchCodingNinjasStats,
  fetchContests
} = require("../services/codingService");
const { analyzeCodingStats } = require("../services/ai/aiProvider");

const getTodayDateString = () => new Date().toISOString().split("T")[0];

exports.updateProfiles = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (req.body.leetcode !== undefined) user.leetcode = req.body.leetcode;
    if (req.body.codeforces !== undefined) user.codeforces = req.body.codeforces;
    if (req.body.codechef !== undefined) user.codechef = req.body.codechef;
    if (req.body.gfg !== undefined) user.gfg = req.body.gfg;
    if (req.body.codingninjas !== undefined) user.codingninjas = req.body.codingninjas;
    if (req.body.tuf !== undefined) user.tuf = req.body.tuf;

    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.updateStrategy = async (req, res, next) => {
  try {
    const { strategy } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { codingStrategy: strategy }, { new: true });
    res.json({ success: true, strategy: user.codingStrategy });
  } catch (error) {
    next(error);
  }
};

exports.getTrackerStats = async (req, res, next) => {
  try {
    let userId = req.params.userId === "me" ? req.user.id : req.params.userId;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const profiles = {
      leetcode: user.leetcode || "",
      codeforces: user.codeforces || "",
      codechef: user.codechef || "",
      gfg: user.gfg || "",
      codingninjas: user.codingninjas || "",
      tuf: user.tuf || ""
    };
    
    // We use a promise wrapper that resolves quickly if data is in cache
    // or waits if it's the first time.
    const [leetcodeStats, codeforcesStats, codechefStats, gfgStats, cnStats] = await Promise.all([
      user.leetcode ? fetchLeetCodeStats(user.leetcode) : null,
      user.codeforces ? fetchCodeforcesStats(user.codeforces) : null,
      user.codechef ? fetchCodeChefStats(user.codechef) : null,
      user.gfg ? fetchGfgStats(user.gfg) : null,
      user.codingninjas ? fetchCodingNinjasStats(user.codingninjas) : null
    ]);

    // Compute streak
    const activities = await CodingActivity.find({ user: userId }).sort({ date: -1 });
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (activities.length > 0) {
      const uniqueDates = [...new Set(activities.map(a => a.date))].sort((a,b) => b.localeCompare(a));
      
      const todayStr = getTodayDateString();
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        currentStreak = 1;
        let cursor = new Date(uniqueDates[0]);
        for (let i = 1; i < uniqueDates.length; i++) {
          cursor.setDate(cursor.getDate() - 1);
          const cursorStr = cursor.toISOString().split("T")[0];
          if (uniqueDates[i] === cursorStr) {
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
        const prevStr = prev.toISOString().split("T")[0];
        if (uniqueDates[i] === prevStr) {
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

    // AI Feedback - Only update if it's older than 24 hours to save time/cost
    let aiFeedback = user.codingAiFeedback;
    const feedbackAge = user.codingAiFeedbackUpdatedAt ? (Date.now() - new Date(user.codingAiFeedbackUpdatedAt).getTime()) : Infinity;
    
    if (feedbackAge > 24 * 60 * 60 * 1000) {
      // Fetch in background or wait a bit? 
      // For now, let's keep it but optimized
      try {
        let bestStats = leetcodeStats || codeforcesStats || codechefStats || gfgStats;
        if (bestStats) {
          const feedback = await analyzeCodingStats({ platform: bestStats.platform, stats: bestStats });
          aiFeedback = feedback.raw;
          user.codingAiFeedback = aiFeedback;
          user.codingAiFeedbackUpdatedAt = new Date();
          await user.save();
        }
      } catch (aiErr) {
        console.error("AI Feedback generation failed:", aiErr.message);
      }
    }

    res.status(200).json({
      ok: true,
      profiles,
      strategy: user.codingStrategy || "",
      stats: {
        leetcode: leetcodeStats,
        codeforces: codeforcesStats,
        codechef: codechefStats,
        gfg: gfgStats,
        codingninjas: cnStats,
        tuf: profiles.tuf ? { platform: "tuf", link: profiles.tuf } : null
      },
      currentStreak,
      longestStreak,
      aiFeedback
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
      activityByPlatform[a.platform] = {
        solved: a.solved,
        count: a.problemsCount || 0
      };
    });

    res.status(200).json({ ok: true, activityToday: activityByPlatform });
  } catch (error) {
    next(error);
  }
};

exports.markProblemSolved = async (req, res, next) => {
  try {
    const { platform } = req.body;
    const allowedPlatforms = ["leetcode", "codeforces", "codechef", "tuf", "gfg", "codingninjas"];
    if (!allowedPlatforms.includes(platform)) {
      return res.status(400).json({ ok: false, error: "Invalid platform" });
    }

    const today = getTodayDateString();
    
    const activity = await CodingActivity.findOneAndUpdate(
      { user: req.user._id, date: today, platform },
      { $set: { solved: true }, $inc: { problemsCount: 1 } },
      { returnDocument: 'after', upsert: true }
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
