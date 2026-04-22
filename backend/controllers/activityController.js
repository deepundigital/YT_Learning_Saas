const UserActivity = require("../models/UserActivity");

const getTodayDateString = () => {
  return new Date().toISOString().split("T")[0];
};

exports.completeTask = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const date = getTodayDateString();

    const activity = await UserActivity.findOneAndUpdate(
      { userId, date },
      { $inc: { tasksCompleted: 1 } },
      { returnDocument: 'after', upsert: true }
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

    const completedDates = [];
    let longestStreak = 0;
    
    let tempStreak = 0;
    let previousDate = null;
    
    activities.forEach(a => {
      if (a.tasksCompleted > 0) {
        completedDates.push(a.date);
        if (!previousDate) {
          tempStreak = 1;
        } else {
          const d1 = new Date(previousDate);
          const d2 = new Date(a.date);
          const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak += 1;
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
        }
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        previousDate = a.date;
      }
    });

    let currentStreak = 0;
    const todayStr = getTodayDateString();
    const dateSet = new Set(completedDates);
    
    if (dateSet.has(todayStr)) {
      currentStreak = 1;
      let cursor = new Date(todayStr);
      while (true) {
        cursor.setDate(cursor.getDate() - 1);
        const prevStr = cursor.toISOString().split("T")[0];
        if (dateSet.has(prevStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      let yesterday = new Date(todayStr);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      if (dateSet.has(yesterdayStr)) {
        currentStreak = 1;
        let cursor = new Date(yesterdayStr);
        while (true) {
          cursor.setDate(cursor.getDate() - 1);
          const prevStr = cursor.toISOString().split("T")[0];
          if (dateSet.has(prevStr)) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    console.log("[Streak API] Returning =>", { currentStreak, longestStreak, completedCount: completedDates.length });

    res.status(200).json({
      ok: true,
      currentStreak,
      longestStreak,
      completedDates,
      activityMap: Object.fromEntries(completedDates.map(d => [d, 1]))
    });
  } catch (error) {
    next(error);
  }
};
