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

exports.getDashboardStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const profiles = user.codingProfiles || {};
    
    // Fetch stats in parallel
    const [leetcodeStats, codeforcesStats, codechefStats] = await Promise.all([
      profiles.leetcode ? fetchLeetCodeStats(profiles.leetcode) : null,
      profiles.codeforces ? fetchCodeforcesStats(profiles.codeforces) : null,
      profiles.codechef ? fetchCodeChefStats(profiles.codechef) : null
    ]);

    // Fetch today's activity
    const today = getTodayDateString();
    const todayActivities = await CodingActivity.find({ user: req.user._id, date: today });

    const activityByPlatform = {};
    todayActivities.forEach(a => {
      activityByPlatform[a.platform] = true;
    });

    res.status(200).json({
      ok: true,
      profiles,
      stats: {
        leetcode: leetcodeStats,
        codeforces: codeforcesStats,
        codechef: codechefStats,
        tuf: profiles.tuf ? { platform: "tuf", link: profiles.tuf } : null
      },
      activityToday: activityByPlatform
    });
  } catch (error) {
    next(error);
  }
};

exports.markProblemSolved = async (req, res, next) => {
  try {
    const { platform } = req.body; // 'leetcode', 'codeforces', 'codechef', 'tuf'
    if (!["leetcode", "codeforces", "codechef", "tuf"].includes(platform)) {
      return res.status(400).json({ ok: false, error: "Invalid platform" });
    }

    const today = getTodayDateString();
    
    const activity = await CodingActivity.findOneAndUpdate(
      { user: req.user._id, date: today, platform },
      { $set: { solved: true }, $inc: { problemsCount: 1 } },
      { new: true, upsert: true }
    );

    // Broadcast active status
    const io = req.app.get("io");
    if (io) {
      const userDoc = await User.findById(req.user._id).select("name avatar username");
      io.emit("userActiveToday", {
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

exports.getSocialLeaderboard = async (req, res, next) => {
  try {
    const today = getTodayDateString();
    
    // Fetch all activities for today
    const activities = await CodingActivity.find({ date: today }).populate("user", "name avatar username");
    
    // Group by user
    const activeUsersMap = {};
    activities.forEach(a => {
      if (a.user) {
        const uid = a.user._id.toString();
        if (!activeUsersMap[uid]) {
          activeUsersMap[uid] = {
            user: a.user,
            platforms: []
          };
        }
        activeUsersMap[uid].platforms.push(a.platform);
      }
    });

    const activeUsers = Object.values(activeUsersMap);

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
