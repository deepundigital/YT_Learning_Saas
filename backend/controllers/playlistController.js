const Playlist = require("../models/Playlist");
const Video = require("../models/Video");
const youtubeService = require("../services/youtubeService");

async function listPlaylists(req, res, next) {
  try {
    const playlists = await Playlist.find({ user: req.user._id })
      .populate("videos.video")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      ok: true,
      count: playlists.length,
      playlists
    });
  } catch (error) {
    next(error);
  }
}

async function getPlaylistById(req, res, next) {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.playlistId,
      user: req.user._id
    }).populate("videos.video");

    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: "Playlist not found"
      });
    }

    return res.status(200).json({
      ok: true,
      playlist
    });
  } catch (error) {
    next(error);
  }
}

async function createPlaylist(req, res, next) {
  try {
    const {
      title,
      description,
      sourceType,
      youtubePlaylistId,
      tags,
      visibility,
      isFavorite
    } = req.body;

    const playlist = await Playlist.create({
      user: req.user._id,
      title: String(title).trim(),
      description: description || "",
      sourceType: sourceType || "custom",
      youtubePlaylistId: youtubePlaylistId || "",
      tags: Array.isArray(tags) ? tags : [],
      visibility: visibility || "private",
      isFavorite: Boolean(isFavorite)
    });

    return res.status(201).json({
      ok: true,
      message: "Playlist created successfully",
      playlist
    });
  } catch (error) {
    next(error);
  }
}

async function importYoutubePlaylist(req, res, next) {
  try {
    const { playlistId, title = "", description = "" } = req.body;

    if (!playlistId || !String(playlistId).trim()) {
      return res.status(400).json({
        ok: false,
        error: "playlistId is required"
      });
    }

    const imported = await youtubeService.getPlaylistVideos(String(playlistId).trim());

    const videos = [];
    const thumbs = [];
    let totalDurationSec = 0;

    for (let i = 0; i < imported.length; i += 1) {
      const item = imported[i];

      let video = await Video.findOne({ youtubeId: item.youtubeId });

      if (!video) {
        video = await Video.create({
          youtubeId: item.youtubeId,
          title: item.title,
          description: item.description || "",
          channelTitle: item.channelTitle || "",
          thumbnails: item.thumbnails || {},
          publishedAt: item.publishedAt || null
        });
      }

      totalDurationSec += Number(video.durationSec || 0);

      videos.push({
        video: video._id,
        order: i + 1
      });

      if (item?.thumbnails?.medium) thumbs.push(item.thumbnails.medium);
      else if (item?.thumbnails?.default) thumbs.push(item.thumbnails.default);
    }

    const playlist = await Playlist.create({
      user: req.user._id,
      title: title || `Imported Playlist ${String(playlistId).trim()}`,
      description,
      sourceType: "youtube",
      youtubePlaylistId: String(playlistId).trim(),
      thumbnails: thumbs.slice(0, 4),
      videos,
      totalVideos: videos.length,
      totalDurationSec
    });

    return res.status(201).json({
      ok: true,
      message: "YouTube playlist imported successfully",
      playlist
    });
  } catch (error) {
    next(error);
  }
}

async function addVideoToPlaylist(req, res, next) {
  try {
    const { videoId } = req.body;

    if (!videoId || !/^[a-fA-F0-9]{24}$/.test(String(videoId))) {
      return res.status(400).json({
        ok: false,
        error: "Invalid videoId"
      });
    }

    const playlist = await Playlist.findOne({
      _id: req.params.playlistId,
      user: req.user._id
    });

    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: "Playlist not found"
      });
    }

    const alreadyExists = playlist.videos.some(
      (item) => String(item.video) === String(videoId)
    );

    if (alreadyExists) {
      return res.status(409).json({
        ok: false,
        error: "Video already exists in playlist"
      });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        ok: false,
        error: "Video not found"
      });
    }

    playlist.videos.push({
      video: videoId,
      order: playlist.videos.length + 1
    });

    playlist.totalVideos = playlist.videos.length;
    playlist.totalDurationSec = Number(playlist.totalDurationSec || 0) + Number(video.durationSec || 0);

    await playlist.save();

    const populated = await Playlist.findById(playlist._id).populate("videos.video");

    return res.status(200).json({
      ok: true,
      message: "Video added to playlist",
      playlist: populated
    });
  } catch (error) {
    next(error);
  }
}

async function updatePlaylist(req, res, next) {
  try {
    const allowed = ["title", "description", "tags", "visibility", "isFavorite"];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const playlist = await Playlist.findOneAndUpdate(
      { _id: req.params.playlistId, user: req.user._id },
      updates,
      { returnDocument: "after", runValidators: true }
    ).populate("videos.video");

    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: "Playlist not found"
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Playlist updated successfully",
      playlist
    });
  } catch (error) {
    next(error);
  }
}

async function removeVideoFromPlaylist(req, res, next) {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.playlistId,
      user: req.user._id
    }).populate("videos.video");

    if (!playlist) {
      return res.status(404).json({
        ok: false,
        error: "Playlist not found"
      });
    }

    const removedItems = playlist.videos.filter(
      (item) => String(item.video?._id || item.video) === String(req.params.videoId)
    );

    playlist.videos = playlist.videos.filter(
      (item) => String(item.video?._id || item.video) !== String(req.params.videoId)
    );

    playlist.videos = playlist.videos.map((item, index) => ({
      video: item.video?._id || item.video,
      order: index + 1,
      addedAt: item.addedAt
    }));

    const removedDuration = removedItems.reduce(
      (sum, item) => sum + Number(item.video?.durationSec || 0),
      0
    );

    playlist.totalVideos = playlist.videos.length;
    playlist.totalDurationSec = Math.max(0, Number(playlist.totalDurationSec || 0) - removedDuration);

    await playlist.save();

    const populated = await Playlist.findById(playlist._id).populate("videos.video");

    return res.status(200).json({
      ok: true,
      message: "Video removed from playlist",
      playlist: populated
    });
  } catch (error) {
    next(error);
  }
}

async function deletePlaylist(req, res, next) {
  try {
    const deleted = await Playlist.findOneAndDelete({
      _id: req.params.playlistId,
      user: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: "Playlist not found"
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Playlist deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listPlaylists,
  getPlaylistById,
  createPlaylist,
  importYoutubePlaylist,
  addVideoToPlaylist,
  updatePlaylist,
  removeVideoFromPlaylist,
  deletePlaylist
};