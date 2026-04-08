function getXpFromCompletion({ completedVideo = false, completedPlaylist = false, passedQuiz = false } = {}) {
  let xp = 0;

  if (completedVideo) xp += 20;
  if (completedPlaylist) xp += 100;
  if (passedQuiz) xp += 30;

  return xp;
}

function getAchievementCandidates(summary = {}) {
  const achievements = [];

  if ((summary.completedVideos || 0) >= 1) {
    achievements.push({
      code: "FIRST_VIDEO_COMPLETE",
      title: "First Video Complete",
      description: "Completed your first tracked learning video",
      icon: "🎬",
      category: "watch",
      xpReward: 20
    });
  }

  if ((summary.completedVideos || 0) >= 10) {
    achievements.push({
      code: "TEN_VIDEOS_COMPLETE",
      title: "10 Videos Completed",
      description: "Completed ten learning videos",
      icon: "📚",
      category: "watch",
      xpReward: 50
    });
  }

  if ((summary.totalQuizAttempts || 0) >= 1) {
    achievements.push({
      code: "FIRST_QUIZ_ATTEMPT",
      title: "First Quiz Attempt",
      description: "Attempted your first quiz",
      icon: "🧠",
      category: "quiz",
      xpReward: 15
    });
  }

  if ((summary.totalCertificates || 0) >= 1) {
    achievements.push({
      code: "FIRST_CERTIFICATE",
      title: "First Certificate",
      description: "Added or earned your first certificate",
      icon: "📜",
      category: "certificate",
      xpReward: 40
    });
  }

  return achievements;
}

module.exports = {
  getXpFromCompletion,
  getAchievementCandidates
};