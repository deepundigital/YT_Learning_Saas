const cron = require("node-cron");
const User = require("../models/User");
const CodingActivity = require("../models/CodingActivity");
const { fetchLeetCodeStats, fetchCodeforcesStats, fetchCodeChefStats } = require("../services/codingService");

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const syncActivity = async (io) => {
  console.log("[Cron] Starting hourly coding activity sync...");
  try {
    const users = await User.find({ "codingProfiles": { $exists: true } });
    const today = getTodayDateString();

    let updatedCount = 0;

    for (const user of users) {
      const profiles = user.codingProfiles || {};
      const promises = [];

      if (profiles.leetcode) promises.push(fetchLeetCodeStats(profiles.leetcode));
      if (profiles.codeforces) promises.push(fetchCodeforcesStats(profiles.codeforces));
      if (profiles.codechef) promises.push(fetchCodeChefStats(profiles.codechef));

      const [lc, cf, cc] = await Promise.allSettled(promises);

      const toUpdate = [];
      if (lc && lc.status === "fulfilled" && lc.value?.solvedToday) toUpdate.push("leetcode");
      if (cf && cf.status === "fulfilled" && cf.value?.solvedToday) toUpdate.push("codeforces");
      // For CodeChef, we only have total solved. If we wanted to track solved today, we'd need to compare with yesterday's snapshot.
      // For now, if we scrape it and want to treat it as solved today (if total increased), we'd need a separate mechanism.
      // We will skip CodeChef auto-sync for "solved today" unless they manually trigger it, or we rely on total solved increasing.
      // For this implementation, LeetCode and CodeForces provide exact submission timestamps, which perfectly satisfy auto-sync.

      for (const platform of toUpdate) {
        const activity = await CodingActivity.findOneAndUpdate(
          { user: user._id, date: today, platform },
          { $set: { solved: true } },
          { new: true, upsert: true }
        );

        if (io) {
          io.emit("activityUpdated", {
            userId: user._id,
            name: user.name,
            avatar: user.avatar,
            platform,
            problemsCount: activity.problemsCount
          });
        }
        updatedCount++;
      }
    }

    console.log(`[Cron] Sync complete. ${updatedCount} activities updated.`);
  } catch (err) {
    console.error("[Cron] Error syncing activity:", err);
  }
};

const initCron = (io) => {
  // Run every hour
  cron.schedule("0 * * * *", () => {
    syncActivity(io);
  });
  console.log("[Cron] Coding activity sync job scheduled (0 * * * *)");
};

module.exports = { initCron, syncActivity };
