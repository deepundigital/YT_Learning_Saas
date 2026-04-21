const Task = require("../models/Task");
const UserActivity = require("../models/UserActivity");

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

exports.getTasks = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // Get tasks for today or all tasks depending on query, defaulting to today
    const date = req.query.date || getTodayDateString();
    
    const tasks = await Task.find({ userId, date }).sort({ createdAt: -1 });
    res.status(200).json({ ok: true, tasks });
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const { title, date } = req.body;
    const userId = req.user._id;
    const taskDate = date || getTodayDateString();

    if (!title) {
      return res.status(400).json({ ok: false, error: "Title is required" });
    }

    const task = await Task.create({
      userId,
      title,
      date: taskDate
    });

    res.status(201).json({ ok: true, task });
  } catch (error) {
    next(error);
  }
};

exports.markComplete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: id, userId });
    
    if (!task) {
      return res.status(404).json({ ok: false, error: "Task not found" });
    }

    if (task.completed) {
      return res.status(400).json({ ok: false, error: "Task is already completed" });
    }

    task.completed = true;
    await task.save();

    // Increment user activity
    const date = getTodayDateString();
    await UserActivity.findOneAndUpdate(
      { userId, date },
      { $inc: { tasksCompleted: 1 } },
      { new: true, upsert: true }
    );

    res.status(200).json({ ok: true, task });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const task = await Task.findOneAndDelete({ _id: id, userId });
        if (!task) {
           return res.status(404).json({ ok: false, error: "Task not found" });
        }
        res.status(200).json({ ok: true });
    } catch(error) {
        next(error);
    }
}
