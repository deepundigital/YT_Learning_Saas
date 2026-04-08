const StudyGoal = require("../models/StudyGoal");
const { calculateGoalProgress, normalizeGoalPayload } = require("../services/plannerService");

async function createGoal(req, res, next) {
  try {
    const payload = normalizeGoalPayload(req.body);

    if (!payload.title || payload.targetValue <= 0) {
      return res.status(400).json({
        ok: false,
        error: "Valid title and targetValue are required"
      });
    }

    const goal = await StudyGoal.create({
      user: req.user._id,
      ...payload
    });

    return res.status(201).json({
      ok: true,
      message: "Study goal created successfully",
      goal
    });
  } catch (error) {
    next(error);
  }
}

async function listGoals(req, res, next) {
  try {
    const goals = await StudyGoal.find({ user: req.user._id }).sort({ createdAt: -1 });

    const items = goals.map((goal) => {
      const progress = calculateGoalProgress(goal);
      return {
        ...goal.toObject(),
        ...progress
      };
    });

    return res.status(200).json({
      ok: true,
      count: items.length,
      goals: items
    });
  } catch (error) {
    next(error);
  }
}

async function updateGoal(req, res, next) {
  try {
    const goal = await StudyGoal.findOne({
      _id: req.params.goalId,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        ok: false,
        error: "Study goal not found"
      });
    }

    const payload = normalizeGoalPayload({
      ...goal.toObject(),
      ...req.body
    });

    Object.assign(goal, payload);

    const progress = calculateGoalProgress(goal);
    goal.isCompleted = progress.isCompleted;
    goal.completedAt = progress.isCompleted ? goal.completedAt || new Date() : null;

    await goal.save();

    return res.status(200).json({
      ok: true,
      message: "Study goal updated successfully",
      goal: {
        ...goal.toObject(),
        ...progress
      }
    });
  } catch (error) {
    next(error);
  }
}

async function deleteGoal(req, res, next) {
  try {
    const deleted = await StudyGoal.findOneAndDelete({
      _id: req.params.goalId,
      user: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: "Study goal not found"
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Study goal deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createGoal,
  listGoals,
  updateGoal,
  deleteGoal
};