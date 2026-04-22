const Progress = require("../models/Progress");
const QuizAttempt = require("../models/QuizAttempt");
const Note = require("../models/Note");
const Bookmark = require("../models/Bookmark");
const StudyGoal = require("../models/StudyGoal");
const Certificate = require("../models/Certificate");
const AIInteraction = require("../models/AIInteraction");
const Video = require("../models/Video");

async function getUserAnalyticsSummary(userId) {
  const [
    progressSummary,
    totalNotes,
    totalBookmarks,
    totalQuizAttempts,
    totalGoals,
    completedGoals,
    totalCertificates,
    totalAIInteractions,
    totalVideos,
    recentProgress,
    recentNotes,
    recentBookmarks,
    recentAI
  ] = await Promise.all([
    Progress.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalTrackedVideos: { $sum: 1 },
          completedVideos: {
            $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] }
          },
          totalWatchTimeSec: { $sum: "$watchTimeSec" },
          averageCompletionPercent: {
            $avg: {
              $multiply: [
                {
                  $divide: [
                    "$lastPositionSec",
                    { $cond: [{ $gt: ["$durationSec", 0] }, "$durationSec", 1] }
                  ]
                },
                100
              ]
            }
          }
        }
      }
    ]),
    Note.countDocuments({ user: userId }),
    Bookmark.countDocuments({ user: userId }),
    QuizAttempt.countDocuments({ user: userId }),
    StudyGoal.countDocuments({ user: userId }),
    StudyGoal.countDocuments({ user: userId, status: "completed" }),
    Certificate.countDocuments({ user: userId }),
    AIInteraction.countDocuments({ user: userId }),
    Video.countDocuments({}),
    Progress.find({ userId: userId }).sort({ lastWatchedAt: -1 }).limit(10),
    Note.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
    Bookmark.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
    AIInteraction.find({ user: userId }).sort({ createdAt: -1 }).limit(10)
  ]);

  const base = progressSummary[0] || {
    totalTrackedVideos: 0,
    completedVideos: 0,
    totalWatchTimeSec: 0,
    averageCompletionPercent: 0
  };

  const stats = {
    ...base,
    averageCompletionPercent: Math.round(base.averageCompletionPercent || 0),
    totalNotes,
    totalBookmarks,
    totalQuizAttempts,
    totalGoals,
    completedGoals,
    totalCertificates,
    totalAIInteractions,
    totalVideos
  };

  const recent = {
    progress: recentProgress,
    notes: recentNotes,
    bookmarks: recentBookmarks,
    ai: recentAI
  };

  return { stats, recent };
}

module.exports = {
  getUserAnalyticsSummary
};