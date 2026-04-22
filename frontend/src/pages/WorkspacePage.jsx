import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  FolderPlus,
  Link2,
  ListVideo,
  Pencil,
  PlayCircle,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
  XCircle,
} from "lucide-react";

import AiTabs from "../components/video/AiTabs";
import NotesPanel from "../components/video/NotesPanel";
import BookmarksPanel from "../components/video/BookmarksPanel";


import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  askAi,
  chatWithAi,
  saveQuizAttempt,
  getQuizAttempts,
} from "../services/aiService";

import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylists,
  importYouTubePlaylist,
  removeVideoFromPlaylist,
  renamePlaylist,
} from "../services/playlistService";

import { getVideoMeta } from "../services/videoService";
import { getDashboardAnalytics } from "../services/analyticsService";
import { getAllProgress, updateVideoProgress } from "../services/progressService";

import {
  getNotesByVideo,
  createNote,
  updateNote,
  deleteNote,
} from "../services/notesService";

import {
  getBookmarksByVideo,
  createBookmark,
  deleteBookmark,
} from "../services/bookmarkService";


import {
  createRevisionFromNotes,
  createRevisionFromBookmarks,
} from "../services/revisionService";

function StatChip({ icon: Icon, label, value }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass rounded-2xl border border-white/10 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/5 p-2">
          <Icon size={16} className="text-blue-300" />
        </div>
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function extractPlaylistId(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  if (/^[a-zA-Z0-9_-]+$/.test(input) && input.startsWith("PL")) {
    return input;
  }

  try {
    const url = new URL(input);
    const list = url.searchParams.get("list");
    return list ? list.trim() : "";
  } catch {
    return "";
  }
}

function extractVideoId(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);

    if (
      url.hostname.includes("youtube.com") ||
      url.hostname.includes("youtu.be")
    ) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      const parts = url.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && /^[a-zA-Z0-9_-]{11}$/.test(last)) return last;
    }

    return "";
  } catch {
    return "";
  }
}

function formatWatchTime(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);

  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function loadYouTubeIframeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (!existingScript) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === "function") previous();
      resolve(window.YT);
    };
  });
}

function SectionToggle({ title, icon: Icon, open, onClick, subtitle }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-white/20"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/5 p-2">
          <Icon size={16} className="text-blue-300" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
        </div>
      </div>

      <motion.div animate={{ rotate: open ? 180 : 0 }}>
        <ChevronDown size={16} className="text-muted" />
      </motion.div>
    </button>
  );
}

export default function WorkspacePage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [flashcards, setFlashcards] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [askResponse, setAskResponse] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);

  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  const [playlists, setPlaylists] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");

  const [importValue, setImportValue] = useState("");
  const [importName, setImportName] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  const [videoUrl, setVideoUrl] = useState("");
  const [videoAddLoading, setVideoAddLoading] = useState(false);

  const [importOpen, setImportOpen] = useState(true);
  const [videoAddOpen, setVideoAddOpen] = useState(false);

  const [notice, setNotice] = useState(null);

  const [workspaceStats, setWorkspaceStats] = useState({
    totalTrackedVideos: 0,
    totalWatchTimeSec: 0,
    completedVideos: 0,
    completedGoals: 0,
  });

  const [videoProgress, setVideoProgress] = useState(null);

  const playerHostRef = useRef(null);
  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const lastTrackedPositionRef = useRef(0);
  const pendingSeekAppliedRef = useRef(false);
  const currentProgressRef = useRef(null);

  const showNotice = (type, message) => {
    setNotice({ type, message });
    window.clearTimeout(window.__workspaceNoticeTimer);
    window.__workspaceNoticeTimer = window.setTimeout(() => {
      setNotice(null);
    }, 2800);
  };

  const selectedPlaylist = useMemo(() => {
    return playlists.find((item) => item._id === selectedPlaylistId) || null;
  }, [playlists, selectedPlaylistId]);

  const currentVideo = useMemo(() => {
    const fromSelectedPlaylist = selectedPlaylist?.videos?.find(
      (item) => item.videoId === videoId
    );

    if (fromSelectedPlaylist) {
      return {
        youtubeId: fromSelectedPlaylist.videoId,
        title: fromSelectedPlaylist.title,
        thumbnail: fromSelectedPlaylist.thumbnail || "",
      };
    }

    for (const playlist of playlists) {
      const found = playlist?.videos?.find((item) => item.videoId === videoId);
      if (found) {
        return {
          youtubeId: found.videoId,
          title: found.title,
          thumbnail: found.thumbnail || "",
        };
      }
    }

    return {
      youtubeId: videoId || "",
      title: "Selected Video",
      thumbnail: videoId
        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        : "",
    };
  }, [playlists, selectedPlaylist, videoId]);

  const loadPlaylists = async () => {
    try {
      setPlaylistLoading(true);
      const res = await getPlaylists();
      const items = res?.playlists || [];
      setPlaylists(items);

      if (!videoId) {
        setSelectedPlaylistId(items[0]?._id || "");
        return;
      }

      const containingPlaylist = items.find((playlist) =>
        playlist?.videos?.some((video) => video.videoId === videoId)
      );

      if (containingPlaylist) {
        setSelectedPlaylistId(containingPlaylist._id);
      } else if (items.length > 0) {
        setSelectedPlaylistId((prev) => {
          if (items.some((p) => p._id === prev)) return prev;
          return items[0]._id;
        });
      } else {
        setSelectedPlaylistId("");
      }
    } catch (error) {
      console.error("Load playlists error:", error);
      setPlaylists([]);
      setSelectedPlaylistId("");
      showNotice("error", "Playlists load nahi hui.");
    } finally {
      setPlaylistLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlPlaylistId = params.get("playlistId");

    if (urlPlaylistId) {
      handleAutoImportPlaylist(urlPlaylistId);
    }
  }, [location.search]);

  const handleAutoImportPlaylist = async (id) => {
    try {
      setPlaylistLoading(true);
      const res = await getPlaylists();
      const items = res?.playlists || [];
      setPlaylists(items);

      const existing = items.find((p) => p.youtubeId === id);

      if (existing) {
        setSelectedPlaylistId(existing._id);
        if (!videoId && existing.videos?.length > 0) {
          navigate(`/workspace/${existing.videos[0].videoId}`, { replace: true });
        }
        return;
      }

      const importRes = await importYouTubePlaylist(id, "Imported Playlist");
      const newPlaylist = importRes?.playlist;

      if (newPlaylist) {
        setPlaylists((prev) => [newPlaylist, ...prev]);
        setSelectedPlaylistId(newPlaylist._id);
        showNotice("success", "Playlist automatically imported.");

        if (!videoId && newPlaylist.videos?.length > 0) {
          navigate(`/workspace/${newPlaylist.videos[0].videoId}`, { replace: true });
        }
      }
    } catch (error) {
      console.error("Auto import error:", error);
    } finally {
      setPlaylistLoading(false);
    }
  };

  const loadQuizAttempts = async () => {
    if (!videoId) {
      setQuizAttempts([]);
      return;
    }

    try {
      const res = await getQuizAttempts(videoId);
      setQuizAttempts(res?.attempts || []);
    } catch (error) {
      console.error("Quiz attempts load error:", error);
      setQuizAttempts([]);
    }
  };

  const loadWorkspaceStats = async () => {
    try {
      const res = await getDashboardAnalytics();
      setWorkspaceStats(
        res?.stats || {
          totalTrackedVideos: 0,
          totalWatchTimeSec: 0,
          completedVideos: 0,
          completedGoals: 0,
        }
      );
    } catch (error) {
      console.error("Workspace stats load error:", error);
      setWorkspaceStats({
        totalTrackedVideos: 0,
        totalWatchTimeSec: 0,
        completedVideos: 0,
        completedGoals: 0,
      });
    }
  };

  const loadNotes = async () => {
    if (!videoId) {
      setNotes([]);
      return;
    }

    try {
      setNotesLoading(true);
      const res = await getNotesByVideo(videoId);
      setNotes(res?.notes || []);
    } catch (error) {
      console.error("Load notes error:", error);
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!videoId) {
      setBookmarks([]);
      return;
    }

    try {
      setBookmarksLoading(true);
      const res = await getBookmarksByVideo(videoId);
      setBookmarks(res?.bookmarks || []);
    } catch (error) {
      console.error("Load bookmarks error:", error);
      setBookmarks([]);
    } finally {
      setBookmarksLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      setGoalsLoading(true);
      const res = await getStudyGoals();
      setGoals(res?.goals || []);
    } catch (error) {
      console.error("Load goals error:", error);
      setGoals([]);
    } finally {
      setGoalsLoading(false);
    }
  };

  const loadCurrentVideoProgress = async () => {
    if (!videoId) {
      setVideoProgress(null);
      currentProgressRef.current = null;
      lastTrackedPositionRef.current = 0;
      pendingSeekAppliedRef.current = false;
      return;
    }

    try {
      const res = await getAllProgress();
      const all = res?.progress || [];
      const found = all.find((item) => item.videoId === videoId) || null;

      setVideoProgress(found);
      currentProgressRef.current = found;
      lastTrackedPositionRef.current = found?.lastPositionSec || 0;
      pendingSeekAppliedRef.current = false;
    } catch (error) {
      console.error("Load current video progress error:", error);
      setVideoProgress(null);
      currentProgressRef.current = null;
      lastTrackedPositionRef.current = 0;
      pendingSeekAppliedRef.current = false;
    }
  };

  const getCurrentPlayerTimestamp = () => {
    try {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return 0;
      return Math.floor(player.getCurrentTime() || 0);
    } catch {
      return 0;
    }
  };

  const seekPlayerToTimestamp = (seconds = 0) => {
    try {
      const player = playerRef.current;
      if (!player || typeof player.seekTo !== "function") return;
      player.seekTo(Number(seconds) || 0, true);
    } catch (error) {
      console.error("Seek player error:", error);
    }
  };

  useEffect(() => {
    setSummary(null);
    setFlashcards(null);
    setQuiz(null);
    setAskResponse(null);
    setChatMessages([]);

    loadQuizAttempts();
    loadNotes();
    loadBookmarks();
    loadWorkspaceStats();
    loadCurrentVideoProgress();
  }, [videoId]);

  useEffect(() => {
    loadPlaylists();
  }, [videoId]);

  useEffect(() => {
    if (!videoId) return;

    let cancelled = false;

    const initPlayer = async () => {
      const YT = await loadYouTubeIframeAPI();

      if (cancelled || !playerHostRef.current) return;

      stopProgressTimer();

      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new YT.Player(playerHostRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event) => {
            const existing = currentProgressRef.current;

            if (
              existing?.lastPositionSec > 0 &&
              !pendingSeekAppliedRef.current
            ) {
              event.target.seekTo(existing.lastPositionSec, true);
              pendingSeekAppliedRef.current = true;
            }
          },
          onStateChange: async (event) => {
            const state = event.data;

            if (state === window.YT.PlayerState.PLAYING) {
              startProgressTimer();
            }

            if (
              state === window.YT.PlayerState.PAUSED ||
              state === window.YT.PlayerState.ENDED
            ) {
              stopProgressTimer();
              await syncProgressNow();
              await loadWorkspaceStats();
            }
          },
        },
      });
    };

    initPlayer();

    return () => {
      cancelled = true;
      stopProgressTimer();

      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  useEffect(() => {
    const player = playerRef.current;

    if (
      player &&
      typeof player.seekTo === "function" &&
      videoProgress?.lastPositionSec > 0 &&
      !pendingSeekAppliedRef.current
    ) {
      player.seekTo(videoProgress.lastPositionSec, true);
      pendingSeekAppliedRef.current = true;
    }
  }, [videoProgress]);

  const syncProgressNow = async () => {
    try {
      if (!videoId) return;

      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== "function") return;

      const currentPositionSec = Math.floor(player.getCurrentTime() || 0);
      const durationSec = Math.floor(player.getDuration?.() || 0);

      const deltaWatchSec = Math.max(
        0,
        Math.min(10, currentPositionSec - (lastTrackedPositionRef.current || 0))
      );

      const res = await updateVideoProgress({
        videoId,
        title: currentVideo.title || "Video",
        deltaWatchSec,
        currentPositionSec,
        durationSec,
      });

      const updated = res?.progress || null;
      setVideoProgress(updated);
      currentProgressRef.current = updated;
      lastTrackedPositionRef.current = currentPositionSec;
    } catch (error) {
      console.error("Progress sync error:", error);
    }
  };

  const stopProgressTimer = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const startProgressTimer = () => {
    stopProgressTimer();
    progressIntervalRef.current = setInterval(() => {
      syncProgressNow();
    }, 5000);
  };

  const handleCreatePlaylist = async () => {
    const name = window.prompt("Playlist name");
    if (!name?.trim()) return;

    try {
      setPlaylistLoading(true);
      const res = await createPlaylist(name.trim());
      const playlist = res?.playlist;

      if (playlist) {
        setPlaylists((prev) => [playlist, ...prev]);
        setSelectedPlaylistId(playlist._id);
        showNotice("success", "Playlist create ho gayi.");
      }
    } catch (error) {
      console.error("Create playlist error:", error);
      showNotice("error", "Playlist create nahi hui.");
    } finally {
      setPlaylistLoading(false);
    }
  };

  const handleImportPlaylist = async () => {
    const playlistId = extractPlaylistId(importValue);

    if (!playlistId) {
      showNotice("error", "Valid YouTube playlist URL ya ID daalo.");
      return;
    }

    try {
      setImportLoading(true);
      const res = await importYouTubePlaylist(
        playlistId,
        importName.trim() || "Imported Playlist"
      );
      const playlist = res?.playlist;

      if (playlist) {
        setPlaylists((prev) => [playlist, ...prev]);
        setSelectedPlaylistId(playlist._id);
        setImportValue("");
        setImportName("");
        showNotice("success", "Playlist import ho gayi.");
      }
    } catch (error) {
      console.error("Import playlist error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          "Playlist import nahi hui."
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleRenamePlaylist = async () => {
    if (!selectedPlaylist) return;

    const name = window.prompt("New playlist name", selectedPlaylist.name || "");
    if (!name?.trim()) return;

    try {
      const res = await renamePlaylist(selectedPlaylist._id, name.trim());
      const updated = res?.playlist;
      if (updated) {
        setPlaylists((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
        showNotice("success", "Playlist rename ho gayi.");
      }
    } catch (error) {
      console.error("Rename playlist error:", error);
      showNotice("error", "Playlist rename nahi hui.");
    }
  };

  const handleDeletePlaylist = async () => {
    if (!selectedPlaylist) return;

    const ok = window.confirm(`Delete playlist "${selectedPlaylist.name}"?`);
    if (!ok) return;

    try {
      await deletePlaylist(selectedPlaylist._id);

      const nextPlaylists = playlists.filter(
        (item) => item._id !== selectedPlaylist._id
      );
      setPlaylists(nextPlaylists);
      setSelectedPlaylistId(nextPlaylists[0]?._id || "");
      showNotice("success", "Playlist delete ho gayi.");
    } catch (error) {
      console.error("Delete playlist error:", error);
      showNotice("error", "Playlist delete nahi hui.");
    }
  };

  const handleAddCurrentVideoToPlaylist = async () => {
    if (!selectedPlaylist || !videoId) {
      showNotice("error", "Pehle ek playlist select ya create karo.");
      return;
    }

    try {
      const payload = {
        videoId,
        title: currentVideo.title || "Selected Video",
        thumbnail:
          currentVideo.thumbnail ||
          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      };

      const res = await addVideoToPlaylist(selectedPlaylist._id, payload);
      const updated = res?.playlist;
      if (updated) {
        setPlaylists((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
        showNotice("success", "Current video add ho gaya.");
      }
    } catch (error) {
      console.error("Add video to playlist error:", error);
      showNotice("error", "Video playlist me add nahi hua.");
    }
  };

  const handleAddVideoByUrl = async () => {
    if (!selectedPlaylist) {
      showNotice("error", "Pehle ek playlist select ya create karo.");
      return;
    }

    const extractedVideoId = extractVideoId(videoUrl);
    if (!extractedVideoId) {
      showNotice("error", "Valid YouTube video URL ya ID daalo.");
      return;
    }

    try {
      setVideoAddLoading(true);

      const res = await getVideoMeta(extractedVideoId);

      const title =
        res?.video?.title ||
        res?.title ||
        `YouTube Video ${extractedVideoId}`;

      const thumbnail =
        res?.video?.thumbnails?.high ||
        res?.video?.thumbnails?.medium ||
        res?.video?.thumbnails?.default ||
        res?.video?.thumbnail ||
        `https://img.youtube.com/vi/${extractedVideoId}/mqdefault.jpg`;

      const addRes = await addVideoToPlaylist(selectedPlaylist._id, {
        videoId: extractedVideoId,
        title,
        thumbnail,
      });

      const updated = addRes?.playlist;
      if (updated) {
        setPlaylists((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
      }

      setVideoUrl("");
      showNotice("success", "Video playlist me add ho gaya.");
    } catch (error) {
      console.error("Add video by URL error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          "Video add nahi hua."
      );
    } finally {
      setVideoAddLoading(false);
    }
  };

  const handleRemoveVideo = async (playlistId, targetVideoId) => {
    try {
      const res = await removeVideoFromPlaylist(playlistId, targetVideoId);
      const updated = res?.playlist;
      if (updated) {
        setPlaylists((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
      }

      if (targetVideoId === videoId) {
        const nextVideo = updated?.videos?.[0]?.videoId;
        if (nextVideo) {
          navigate(`/workspace/${nextVideo}`);
        }
      }

      showNotice("success", "Video remove ho gaya.");
    } catch (error) {
      console.error("Remove video error:", error);
      showNotice("error", "Video remove nahi hua.");
    }
  };

  const handleCreateNote = async ({ title, content, timestampSec, tags }) => {
    try {
      if (!videoId) return;

      try {
        await getVideoMeta(videoId);
      } catch {
        // ignore
      }

      await createNote({
        youtubeId: videoId,
        title,
        content,
        timestampSec,
        tags,
        type: "manual",
      });

      await loadNotes();
      showNotice("success", "Note save ho gayi.");
    } catch (error) {
      console.error("Create note error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          "Note save nahi hui."
      );
    }
  };

  const handleUpdateNote = async (noteId, payload) => {
    try {
      await updateNote(noteId, payload);
      await loadNotes();
      showNotice("success", "Note update ho gayi.");
    } catch (error) {
      console.error("Update note error:", error);
      showNotice("error", "Note update nahi hui.");
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      await loadNotes();
      showNotice("success", "Note delete ho gayi.");
    } catch (error) {
      console.error("Delete note error:", error);
      showNotice("error", "Note delete nahi hui.");
    }
  };

  const handleCreateBookmark = async ({ label, note, timestampSec }) => {
    try {
      if (!videoId) return;

      try {
        await getVideoMeta(videoId);
      } catch {
        // ignore
      }

      await createBookmark({
        youtubeId: videoId,
        label,
        note,
        timestampSec,
      });

      await loadBookmarks();
      showNotice("success", "Bookmark save ho gaya.");
    } catch (error) {
      console.error("Create bookmark error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          "Bookmark save nahi hua."
      );
    }
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      await deleteBookmark(bookmarkId);
      await loadBookmarks();
      showNotice("success", "Bookmark delete ho gaya.");
    } catch (error) {
      console.error("Delete bookmark error:", error);
      showNotice("error", "Bookmark delete nahi hua.");
    }
  };

  const handleCreateGoal = async (payload) => {
    try {
      await createStudyGoal(payload);
      await loadGoals();
      await loadWorkspaceStats();
      showNotice("success", "Study goal create ho gaya.");
    } catch (error) {
      console.error("Create goal error:", error);
      showNotice(
        "error",
        error?.response?.data?.error ||
          error?.response?.data?.details ||
          "Study goal create nahi hua."
      );
    }
  };

  const handleCompleteGoal = async (goalId) => {
    try {
      await updateStudyGoal(goalId, { status: "completed" });
      await loadGoals();
      await loadWorkspaceStats();
      showNotice("success", "Goal completed.");
    } catch (error) {
      console.error("Complete goal error:", error);
      showNotice("error", "Goal complete nahi hua.");
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteStudyGoal(goalId);
      await loadGoals();
      await loadWorkspaceStats();
      showNotice("success", "Goal delete ho gaya.");
    } catch (error) {
      console.error("Delete goal error:", error);
      showNotice("error", "Goal delete nahi hua.");
    }
  };

  const handleCreateRevisionFromNotes = async () => {
    try {
      if (!videoId) return;
      const res = await createRevisionFromNotes(videoId);
      showNotice(
        "success",
        `Notes se ${res?.revisionItemsCreated || 0} revision items bane.`
      );
    } catch (error) {
      console.error("Revision from notes error:", error);
      showNotice("error", "Notes se revision create nahi hui.");
    }
  };

  const handleCreateRevisionFromBookmarks = async () => {
    try {
      if (!videoId) return;
      const res = await createRevisionFromBookmarks(videoId);
      showNotice(
        "success",
        `Bookmarks se ${res?.revisionItemsCreated || 0} revision items bane.`
      );
    } catch (error) {
      console.error("Revision from bookmarks error:", error);
      showNotice("error", "Bookmarks se revision create nahi hui.");
    }
  };

  const handleGenerateSummary = async () => {
    try {
      if (!videoId) return;
      setLoading(true);
      const res = await generateSummary(videoId, true);
      setSummary(res.summary || null);
    } catch (error) {
      console.error("Summary error:", error);
      showNotice("error", "Summary generate nahi hui.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    try {
      if (!videoId) return;
      setLoading(true);
      const res = await generateFlashcards(videoId, 8, true);
      setFlashcards(res.flashcards || null);
    } catch (error) {
      console.error("Flashcards error:", error);
      showNotice("error", "Flashcards generate nahi hue.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      if (!videoId) return;
      setLoading(true);
      const res = await generateQuiz(videoId, 10, true);

      if (res?.quiz?.questions?.length) {
        setQuiz(res.quiz);
      } else if (res?.quiz?.raw) {
        setQuiz({
          raw: res.quiz.raw,
          warning: res.quiz.warning || "Quiz strict JSON me parse nahi hui",
        });
      } else {
        setQuiz({
          raw: "Quiz response empty aaya.",
          warning: "No parsed questions found",
        });
      }
    } catch (error) {
      console.error("Quiz error:", error);
      showNotice("error", "Quiz generate nahi hua.");
    } finally {
      setLoading(false);
    }
  };

  const handleAskAi = async (question) => {
    try {
      if (!videoId) return;
      setLoading(true);
      const res = await askAi(videoId, question);
      setAskResponse(res.answer || res || null);
    } catch (error) {
      console.error("Ask AI error:", error);
      showNotice("error", "Ask AI failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatAi = async (question) => {
    try {
      if (!videoId) return;
      setLoading(true);
      setChatMessages((prev) => [
        ...prev,
        { role: "user", content: question },
      ]);

      const res = await chatWithAi(videoId, question);
      const content =
        res?.message?.answer || res?.message?.raw || "No response received";

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content },
      ]);
    } catch (error) {
      console.error("Chat AI error:", error);
      showNotice("error", "Chat failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async ({ answers }) => {
    try {
      if (!videoId) return null;

      const res = await saveQuizAttempt({
        youtubeId: videoId,
        title: currentVideo.title,
        answers,
      });
      await loadQuizAttempts();
      await loadWorkspaceStats();
      showNotice("success", "Quiz attempt save ho gaya.");
      return res?.attempt || null;
    } catch (error) {
      console.error("Save quiz attempt error:", error);
      showNotice("error", "Quiz save nahi hui.");
      return null;
    }
  };

  const renderEmptyWorkspace = !videoId;

  return (
    <div className="grid h-full gap-5 xl:grid-cols-[1.35fr_0.85fr]">
      <div className="min-w-0 space-y-5">
        <AnimatePresence>
          {notice ? (
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                notice.type === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-300"
              }`}
            >
              {notice.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <XCircle size={16} />
              )}
              <span>{notice.message}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="grid gap-4 md:grid-cols-4">
          <StatChip
            icon={Clock3}
            label="Tracked Videos"
            value={String(workspaceStats.totalTrackedVideos || 0)}
          />
          <StatChip
            icon={PlayCircle}
            label="Watch Time"
            value={formatWatchTime(workspaceStats.totalWatchTimeSec)}
          />
          <StatChip
            icon={Trophy}
            label="Completed"
            value={String(workspaceStats.completedVideos || 0)}
          />
          <StatChip
            icon={Sparkles}
            label="Goals Done"
            value={String(workspaceStats.completedGoals || 0)}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="glass premium-border rounded-[2rem] p-4 md:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-muted">Video Player</p>
              <h2 className="truncate text-xl font-bold">
                {renderEmptyWorkspace ? "No video selected" : currentVideo.title}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                Active session
              </div>
              {videoProgress?.lastPositionSec ? (
                <div className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted">
                  Resume at {formatWatchTime(videoProgress.lastPositionSec)}
                </div>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
            <div className="aspect-video">
              {renderEmptyWorkspace ? (
                <div className="grid h-full place-items-center bg-white/5 p-6 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
                      <PlayCircle className="text-blue-300" size={24} />
                    </div>
                    <h3 className="text-xl font-semibold">No video selected</h3>
                    <p className="mt-2 text-sm text-muted">
                      Playlist se video select karo ya sidebar se kisi item pe click karo.
                    </p>
                  </div>
                </div>
              ) : (
                <div ref={playerHostRef} className="h-full w-full" />
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleAddCurrentVideoToPlaylist}
              disabled={!selectedPlaylist || !videoId}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:border-white/20 disabled:opacity-50"
            >
              Add current to playlist
            </button>

            <button
              onClick={() =>
                navigator.clipboard.writeText(window.location.href).then(() => {
                  showNotice("success", "Workspace link copied.");
                })
              }
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:border-white/20"
            >
              Copy workspace link
            </button>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="glass rounded-[1.5rem] p-5"
          >
            <div className="mb-3 inline-flex rounded-2xl bg-blue-500/10 p-3">
              <Sparkles className="text-blue-300" size={18} />
            </div>
            <h3 className="font-semibold">AI Summary</h3>
            <p className="mt-2 text-sm text-muted">
              Generate quick takeaways and concept breakdowns.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="glass rounded-[1.5rem] p-5"
          >
            <div className="mb-3 inline-flex rounded-2xl bg-violet-500/10 p-3">
              <FileText className="text-violet-300" size={18} />
            </div>
            <h3 className="font-semibold">Flashcards</h3>
            <p className="mt-2 text-sm text-muted">
              Turn the video into revision-ready study cards.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            className="glass rounded-[1.5rem] p-5"
          >
            <div className="mb-3 inline-flex rounded-2xl bg-cyan-500/10 p-3">
              <ListVideo className="text-cyan-300" size={18} />
            </div>
            <h3 className="font-semibold">AI Chat</h3>
            <p className="mt-2 text-sm text-muted">
              Ask questions and interact with the learning content.
            </p>
          </motion.div>
        </div>

        {!renderEmptyWorkspace ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.45 }}
              className="glass premium-border rounded-[2rem] p-4 md:p-5"
            >
              <NotesPanel
                notes={notes}
                loading={notesLoading}
                onCreateNote={handleCreateNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                getCurrentTimestamp={getCurrentPlayerTimestamp}
                onGenerateRevisionFromNotes={handleCreateRevisionFromNotes}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07, duration: 0.45 }}
              className="glass premium-border rounded-[2rem] p-4 md:p-5"
            >
              <BookmarksPanel
                bookmarks={bookmarks}
                loading={bookmarksLoading}
                onCreateBookmark={handleCreateBookmark}
                onDeleteBookmark={handleDeleteBookmark}
                onSeekToTimestamp={seekPlayerToTimestamp}
                onGenerateRevisionFromBookmarks={handleCreateRevisionFromBookmarks}
                getCurrentTimestamp={getCurrentPlayerTimestamp}
              />
            </motion.div>
          </>
        ) : null}

        

        {!renderEmptyWorkspace ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="glass premium-border rounded-[2rem] p-4 md:p-5"
          >
            <AiTabs
              loading={loading}
              summary={summary}
              flashcards={flashcards}
              quiz={quiz}
              askResponse={askResponse}
              chatMessages={chatMessages}
              quizAttempts={quizAttempts}
              onGenerateSummary={handleGenerateSummary}
              onGenerateFlashcards={handleGenerateFlashcards}
              onGenerateQuiz={handleGenerateQuiz}
              onAskAi={handleAskAi}
              onChatAi={handleChatAi}
              onSubmitQuiz={handleSubmitQuiz}
            />
          </motion.div>
        ) : null}
      </div>

      <motion.aside
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="glass premium-border h-fit rounded-[2rem] p-5 xl:sticky xl:top-24"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Playlists</p>
            <h2 className="text-lg font-bold">
              {selectedPlaylist?.name || "No playlist selected"}
            </h2>
          </div>

          <div className="rounded-2xl bg-white/5 p-3">
            <ListVideo size={18} className="text-blue-300" />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            onClick={handleCreatePlaylist}
            className="glass flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm transition hover:border-white/20"
          >
            <FolderPlus size={16} />
            New
          </button>

          <button
            onClick={handleAddCurrentVideoToPlaylist}
            disabled={!selectedPlaylist || !videoId}
            className="glass flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm transition hover:border-white/20 disabled:opacity-50"
          >
            <Plus size={16} />
            Add current
          </button>

          <button
            onClick={handleRenamePlaylist}
            disabled={!selectedPlaylist}
            className="glass flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm transition hover:border-white/20 disabled:opacity-50"
          >
            <Pencil size={16} />
            Rename
          </button>

          <button
            onClick={handleDeletePlaylist}
            disabled={!selectedPlaylist}
            className="glass flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 px-3 py-2 text-sm text-rose-300 transition hover:border-rose-500/30 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>

        <div className="mb-4 space-y-3">
          <SectionToggle
            title="Import YouTube Playlist"
            subtitle="Paste playlist URL or ID"
            icon={Download}
            open={importOpen}
            onClick={() => setImportOpen((prev) => !prev)}
          />

          <AnimatePresence>
            {importOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/5 p-4"
              >
                <div className="space-y-3">
                  <input
                    value={importValue}
                    onChange={(e) => setImportValue(e.target.value)}
                    placeholder="Paste playlist URL or playlist ID"
                    className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
                  />

                  <input
                    value={importName}
                    onChange={(e) => setImportName(e.target.value)}
                    placeholder="Custom name (optional)"
                    className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
                  />

                  <button
                    onClick={handleImportPlaylist}
                    disabled={importLoading}
                    className="w-full rounded-xl bg-[linear-gradient(135deg,#4f8cff,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-70"
                  >
                    {importLoading ? "Importing..." : "Import Playlist"}
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <SectionToggle
            title="Add Video by URL"
            subtitle="Paste video URL or ID"
            icon={Link2}
            open={videoAddOpen}
            onClick={() => setVideoAddOpen((prev) => !prev)}
          />

          <AnimatePresence>
            {videoAddOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/5 p-4"
              >
                <div className="space-y-3">
                  <input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Paste YouTube video URL or video ID"
                    className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
                  />

                  <button
                    onClick={handleAddVideoByUrl}
                    disabled={videoAddLoading}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:border-white/20 disabled:opacity-70"
                  >
                    {videoAddLoading ? "Adding..." : "Add Video"}
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="mb-5 space-y-2">
          {playlistLoading ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted">
              Loading playlists...
            </div>
          ) : playlists.length ? (
            playlists.map((playlist) => (
              <motion.button
                key={playlist._id}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedPlaylistId(playlist._id)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  playlist._id === selectedPlaylistId
                    ? "border-blue-400/30 bg-blue-500/10 shadow-[0_0_0_1px_rgba(96,165,250,0.15)]"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">
                    {playlist.name}
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-muted">
                    {playlist.videos?.length || 0}
                  </span>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted">
              No playlists yet. Create one or import from YouTube.
            </div>
          )}
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Videos</p>
          <p className="text-xs text-muted">
            {selectedPlaylist?.videos?.length || 0} items
          </p>
        </div>

        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {selectedPlaylist?.videos?.length ? (
            selectedPlaylist.videos.map((video, index) => {
              const active = video.videoId === videoId;

              return (
                <motion.div
                  key={video.videoId}
                  whileHover={{ y: -3 }}
                  className={`rounded-[1.25rem] border p-3 transition ${
                    active
                      ? "border-blue-400/30 bg-blue-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/workspace/${video.videoId}`)}
                      className="block"
                    >
                      <img
                        src={
                          video.thumbnail ||
                          `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`
                        }
                        alt={video.title}
                        className="h-14 w-24 rounded-xl object-cover"
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => navigate(`/workspace/${video.videoId}`)}
                        className="w-full text-left"
                      >
                        <p className="line-clamp-2 text-sm font-medium">
                          {video.title}
                        </p>
                      </button>

                      <div className="mt-2 flex items-center justify-between text-xs text-muted">
                        <span>#{index + 1}</span>

                        <button
                          onClick={() =>
                            handleRemoveVideo(selectedPlaylist._id, video.videoId)
                          }
                          className="rounded-lg border border-rose-500/20 px-2 py-1 text-rose-300 transition hover:border-rose-500/30"
                        >
                          Remove
                        </button>
                      </div>

                      {active ? (
                        <motion.div
                          layoutId="activeVideoBar"
                          className="mt-2 h-1.5 rounded-full bg-[linear-gradient(90deg,#4f8cff,#8b5cf6)]"
                        />
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted">
              {selectedPlaylist
                ? "No videos in this playlist."
                : "Select a playlist to see videos."}
            </div>
          )}
        </div>
      </motion.aside>
    </div>
  );
}