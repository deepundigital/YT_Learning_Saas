function calculateGoalProgress(goal) {
  const currentValue = Number(goal.currentValue || 0);
  const targetValue = Number(goal.targetValue || 0);

  const progressPercent =
    targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0;

  return {
    progressPercent,
    remainingValue: Math.max(0, targetValue - currentValue),
    isCompleted: currentValue >= targetValue
  };
}

function normalizeGoalPayload(payload = {}) {
  return {
    title: String(payload.title || "").trim(),
    description: String(payload.description || "").trim(),
    goalType: payload.goalType || "daily",
    targetValue: Number(payload.targetValue || 0),
    currentValue: Number(payload.currentValue || 0),
    unit: payload.unit || "minutes",
    startDate: payload.startDate ? new Date(payload.startDate) : new Date(),
    endDate: payload.endDate ? new Date(payload.endDate) : new Date(),
    relatedPlaylist: payload.relatedPlaylist || null
  };
}

module.exports = {
  calculateGoalProgress,
  normalizeGoalPayload
};