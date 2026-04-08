const Progress = require("../models/Progress");

async function updateProgress(req, res, next) {
  try {
    const {
      videoId,
      playlistId = null,
      watchedSeconds = 0,
      lastPositionSec = 0,
      maxPositionSec = 0,
      durationSec = 0,
      completionPercent = 0,
      isCompleted = false
    } = req.body;

    let progress = await Progress.findOne({
      user: req.user._id,
      video: videoId
    });

    if (!progress) {
      progress = new Progress({
        user: req.user._id,
        video: videoId,
        playlist: playlistId,
        watchedSeconds,
        lastPositionSec,
        maxPositionSec,
        durationSec,
        completionPercent,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        firstWatchedAt: new Date(),
        lastWatchedAt: new Date(),
        watchSessions: 1
      });
    } else {
      progress.playlist = playlistId || progress.playlist;
      progress.watchedSeconds = Math.max(progress.watchedSeconds || 0, watchedSeconds);
      progress.lastPositionSec = lastPositionSec;
      progress.maxPositionSec = Math.max(progress.maxPositionSec || 0, maxPositionSec);
      progress.durationSec = durationSec || progress.durationSec;
      progress.completionPercent = completionPercent;
      progress.isCompleted = Boolean(isCompleted);
      progress.completedAt =
        Boolean(isCompleted) && !progress.completedAt ? new Date() : progress.completedAt;
      progress.lastWatchedAt = new Date();
      progress.watchSessions = (progress.watchSessions || 0) + 1;
    }

    await progress.save();

    return res.status(200).json({
      ok: true,
      message: "Progress updated successfully",
      progress
    });
  } catch (error) {
    next(error);
  }
}

async function listProgress(req, res, next) {
  try {
    const progressList = await Progress.find({ user: req.user._id })
      .populate("video")
      .populate("playlist")
      .sort({ lastWatchedAt: -1 });

    return res.status(200).json({
      ok: true,
      count: progressList.length,
      progress: progressList
    });
  } catch (error) {
    next(error);
  }
}

async function getVideoProgress(req, res, next) {
  try {
    const progress = await Progress.findOne({
      user: req.user._id,
      video: req.params.videoId
    })
      .populate("video")
      .populate("playlist");

    if (!progress) {
      return res.status(404).json({
        ok: false,
        error: "Progress not found"
      });
    }

    return res.status(200).json({
      ok: true,
      progress
    });
  } catch (error) {
    next(error);
  }
}

async function getContinueWatching(req, res, next) {
  try {
    const items = await Progress.find({
      user: req.user._id,
      isCompleted: false,
      lastPositionSec: { $gt: 0 }
    })
      .populate("video")
      .populate("playlist")
      .sort({ lastWatchedAt: -1 })
      .limit(12);

    return res.status(200).json({
      ok: true,
      count: items.length,
      items
    });
  } catch (error) {
    next(error);
  }
}

async function getRecentProgress(req, res, next) {
  try {
    const items = await Progress.find({
      user: req.user._id
    })
      .populate("video")
      .populate("playlist")
      .sort({ lastWatchedAt: -1 })
      .limit(20);

    return res.status(200).json({
      ok: true,
      count: items.length,
      items
    });
  } catch (error) {
    next(error);
  }
}

async function getProgressSummary(req, res, next) {
  try {
    const summary = await Progress.aggregate([
      {
        $match: {
          user: req.user._id
        }
      },
      {
        $group: {
          _id: null,
          totalTrackedVideos: { $sum: 1 },
          completedVideos: {
            $sum: {
              $cond: [{ $eq: ["$isCompleted", true] }, 1, 0]
            }
          },
          totalWatchTimeSec: { $sum: "$watchedSeconds" },
          averageCompletionPercent: { $avg: "$completionPercent" }
        }
      }
    ]);

    return res.status(200).json({
      ok: true,
      summary:
        summary[0] || {
          totalTrackedVideos: 0,
          completedVideos: 0,
          totalWatchTimeSec: 0,
          averageCompletionPercent: 0
        }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  updateProgress,
  listProgress,
  getVideoProgress,
  getContinueWatching,
  getRecentProgress,
  getProgressSummary
};