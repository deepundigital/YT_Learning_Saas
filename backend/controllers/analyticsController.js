const { getUserAnalyticsSummary } = require("../services/analyticsService");
const { getAchievementCandidates } = require("../services/gamificationSevice");

async function getDashboardSummary(req, res, next) {
  try {
    const summary = await getUserAnalyticsSummary(req.user._id);
    const suggestedAchievements = getAchievementCandidates(summary.stats);

    return res.status(200).json({
      ok: true,
      summary,
      suggestedAchievements
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardSummary
};