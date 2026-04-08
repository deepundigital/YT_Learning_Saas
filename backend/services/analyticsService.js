const Progress = require("../models/Progress");
const QuizAttempt = require("../models/QuizAttempt");
const Note = require("../models/Note");
const Bookmark = require("../models/Bookmark");
const StudyGoal = require("../models/StudyGoal");
const Certificate = require("../models/Certificate");

async function getUserAnalyticsSummary(userId) {
  const [
    progressSummary,
    totalNotes,
    totalBookmarks,
    totalQuizAttempts,
    totalGoals,
    completedGoals,
    totalCertificates
  ] = await Promise.all([
    Progress.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalTrackedVideos: { $sum: 1 },
          completedVideos: {
            $sum: { $cond: [{ $eq: ["$isCompleted", true] }, 1, 0] }
          },
          totalWatchTimeSec: { $sum: "$watchedSeconds" },
          averageCompletionPercent: { $avg: "$completionPercent" }
        }
      }
    ]),
    Note.countDocuments({ user: userId }),
    Bookmark.countDocuments({ user: userId }),
    QuizAttempt.countDocuments({ user: userId }),
    StudyGoal.countDocuments({ user: userId }),
    StudyGoal.countDocuments({ user: userId, isCompleted: true }),
    Certificate.countDocuments({ user: userId })
  ]);

  const base = progressSummary[0] || {
    totalTrackedVideos: 0,
    completedVideos: 0,
    totalWatchTimeSec: 0,
    averageCompletionPercent: 0
  };

  return {
    ...base,
    averageCompletionPercent: Math.round(base.averageCompletionPercent || 0),
    totalNotes,
    totalBookmarks,
    totalQuizAttempts,
    totalGoals,
    completedGoals,
    totalCertificates
  };
}

module.exports = {
  getUserAnalyticsSummary
};