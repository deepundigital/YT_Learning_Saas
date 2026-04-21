const UserActivity = require("../models/UserActivity");

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

exports.completeTask = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const date = getTodayDateString();

    const activity = await UserActivity.findOneAndUpdate(
      { userId, date },
      { $inc: { tasksCompleted: 1 } },
      { new: true, upsert: true }
    );

    res.status(200).json({ ok: true, activity });
  } catch (error) {
    next(error);
  }
};

exports.getStreak = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Fetch all activities for the user, sorted by date ascending
    const activities = await UserActivity.find({ userId }).sort({ date: 1 });

    const activityMap = {};
    activities.forEach(a => {
      activityMap[a.date] = a.tasksCompleted;
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate = null;

    activities.forEach(a => {
      if (a.tasksCompleted > 0) {
        if (!previousDate) {
          tempStreak = 1;
        } else {
          const d1 = new Date(previousDate);
          const d2 = new Date(a.date);
          const diffTime = Math.abs(d2 - d1);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            tempStreak += 1;
          } else if (diffDays > 1) {
            tempStreak = 1; // reset streak if gap > 1 day
          }
        }
        
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
      previousDate = a.date;
    });

    // Check if the streak is still active today or yesterday
    const today = getTodayDateString();
    const dToday = new Date(today);
    const dPrev = previousDate ? new Date(previousDate) : null;
    
    if (dPrev) {
       const diffTime = Math.abs(dToday - dPrev);
       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
       if (diffDays <= 1) {
          currentStreak = tempStreak;
       } else {
          currentStreak = 0;
       }
    }

    res.status(200).json({
      ok: true,
      currentStreak,
      longestStreak,
      activityMap
    });
  } catch (error) {
    next(error);
  }
};
