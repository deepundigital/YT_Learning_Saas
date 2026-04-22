import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Flame,
  ListVideo,
  Plus,
  Target,
  Trash2,
  Trophy,
  Copy,
} from "lucide-react";

import Button from "../components/common/Button";
import { getPlaylists } from "../services/playlistService";
import { getAllProgress } from "../services/progressService";
import { getDashboardAnalytics } from "../services/analyticsService";
import { getStreak } from "../services/activityService";
import {
  getStudyGoals,
  createStudyGoal,
  updateStudyGoal,
  deleteStudyGoal,
} from "../services/plannerService";
import {
  getCertificates,
  createCertificate,
  deleteCertificate,
} from "../services/certificateService";

function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);

  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getLocalQuizAttempts() {
  try {
    const user = getStoredUser();
    const userId = user?._id || user?.id || user?.email || "guest";
    const prefix = `quizAttempts:${userId}:`;

    const attempts = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;

      const raw = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(raw)) {
        attempts.push(...raw);
      }
    }

    return attempts.sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
    );
  } catch {
    return [];
  }
}

function normalizeDateKey(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// calculateStreak is now securely handled by the backend API.

function extractWeakTopicLabel(question = "") {
  const cleaned = String(question)
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(
      /\b(what|which|who|why|how|when|where|is|are|the|a|an|of|to|in|for|and|or|does|do|did|can|could|would|should|best|following)\b/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "General Concept";

  const words = cleaned
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 3);

  if (!words.length) return "General Concept";

  return words.join(" ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function deriveWeakTopics(attempts = []) {
  const topicMap = new Map();

  for (const attempt of attempts) {
    const answers = Array.isArray(attempt?.answers) ? attempt.answers : [];

    for (const answer of answers) {
      if (answer?.isCorrect) continue;

      const topic = extractWeakTopicLabel(answer?.question || "");
      topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
    }
  }

  return Array.from(topicMap.entries())
    .map(([topic, mistakes]) => ({ topic, mistakes }))
    .sort((a, b) => b.mistakes - a.mistakes)
    .slice(0, 5);
}

function StatCard({ icon: Icon, title, value, note, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-500/10 text-blue-300",
    violet: "bg-violet-500/10 text-violet-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
    amber: "bg-amber-500/10 text-amber-300",
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass premium-border rounded-[1.75rem] p-5"
    >
      <div className={`mb-4 inline-flex rounded-2xl p-3 ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-2 text-sm text-muted">{note}</p>
    </motion.div>
  );
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <div className="glass premium-border rounded-[2rem] p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function PlaylistsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState([]);
  const [progressItems, setProgressItems] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [quizAttempts, setQuizAttempts] = useState([]);

  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);

  const [certificates, setCertificates] = useState([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [issuingCertificateId, setIssuingCertificateId] = useState("");

  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalDailyMinutes, setGoalDailyMinutes] = useState(30);
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalSaving, setGoalSaving] = useState(false);

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {
    try {
      setLoading(true);
      setGoalsLoading(true);
      setCertificatesLoading(true);

      const [playlistsRes, progressRes, analyticsRes, goalsRes, certificatesRes, streakRes] =
        await Promise.all([
          getPlaylists(),
          getAllProgress(),
          getDashboardAnalytics(),
          getStudyGoals(),
          getCertificates(),
          getStreak()
        ]);

      setPlaylists(playlistsRes?.playlists || []);
      setProgressItems(progressRes?.progress || []);
      setDashboardStats({ ...(analyticsRes?.stats || {}), currentStreak: streakRes?.currentStreak || 0 });
      setGoals(goalsRes?.goals || []);
      setCertificates(certificatesRes?.certificates || []);
      setQuizAttempts(getLocalQuizAttempts());
    } catch (error) {
      console.error("Progress page load error:", error);
      setPlaylists([]);
      setProgressItems([]);
      setDashboardStats({});
      setGoals([]);
      setCertificates([]);
      setQuizAttempts(getLocalQuizAttempts());
    } finally {
      setLoading(false);
      setGoalsLoading(false);
      setCertificatesLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!goalTitle.trim()) return;

    try {
      setGoalSaving(true);
      await createStudyGoal({
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        youtubeIds: [],
        targetDate: goalTargetDate || null,
        dailyMinutes: Math.max(1, Number(goalDailyMinutes) || 30),
      });

      setGoalTitle("");
      setGoalDescription("");
      setGoalDailyMinutes(30);
      setGoalTargetDate("");

      await loadPage();
    } catch (error) {
      console.error("Create goal error:", error);
    } finally {
      setGoalSaving(false);
    }
  };

  const handleCompleteGoal = async (goalId) => {
    try {
      await updateStudyGoal(goalId, { status: "completed" });
      await loadPage();
    } catch (error) {
      console.error("Complete goal error:", error);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteStudyGoal(goalId);
      await loadPage();
    } catch (error) {
      console.error("Delete goal error:", error);
    }
  };

  const progressMap = useMemo(() => {
    const map = new Map();
    for (const item of progressItems) {
      map.set(item.videoId, item);
    }
    return map;
  }, [progressItems]);

  const playlistTrackers = useMemo(() => {
    return playlists.map((playlist) => {
      const videos = playlist?.videos || [];
      const videoIds = videos.map((video) => video.videoId);

      const linkedProgress = videos
        .map((video) => progressMap.get(video.videoId))
        .filter(Boolean);

      const completedVideos = linkedProgress.filter((item) => item.completed).length;
      const totalVideos = videos.length;
      const completionPercent = totalVideos
        ? Math.round((completedVideos / totalVideos) * 100)
        : 0;

      const totalWatchTimeSec = linkedProgress.reduce(
        (sum, item) => sum + (item.watchTimeSec || 0),
        0
      );

      const relatedQuizAttempts = quizAttempts.filter((attempt) =>
        videoIds.includes(attempt?.youtubeId)
      );

      const weakTopics = deriveWeakTopics(relatedQuizAttempts);

      const nextVideo =
        videos.find((video) => !progressMap.get(video.videoId)?.completed) ||
        videos[0] ||
        null;

      const lastWatchedAt = linkedProgress
        .map((item) => item?.lastWatchedAt || item?.updatedAt)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0];

      return {
        _id: playlist._id,
        name: playlist.name,
        totalVideos,
        completedVideos,
        remainingVideos: Math.max(0, totalVideos - completedVideos),
        completionPercent,
        totalWatchTimeSec,
        nextVideo,
        weakTopics,
        quizAttemptsCount: relatedQuizAttempts.length,
        isCompleted: totalVideos > 0 && completedVideos === totalVideos,
        isInProgress: totalWatchTimeSec > 0 && completedVideos < totalVideos,
        lastWatchedAt,
      };
    });
  }, [playlists, progressMap, quizAttempts]);

  const overall = useMemo(() => {
    const totalPlaylists = playlistTrackers.length;
    const completedPlaylists = playlistTrackers.filter((p) => p.isCompleted).length;
    const inProgressPlaylists = playlistTrackers.filter((p) => p.isInProgress).length;
    const certificateEligible = playlistTrackers.filter((p) => p.isCompleted).length;
    const streakDays = dashboardStats?.currentStreak || 0;

    return {
      totalPlaylists,
      completedPlaylists,
      inProgressPlaylists,
      certificateEligible,
      streakDays,
    };
  }, [playlistTrackers, progressItems]);

  const earnedBadges = useMemo(() => {
    const badges = [];

    if (overall.totalPlaylists >= 1) {
      badges.push({
        title: "Playlist Starter",
        desc: "Created or imported your first playlist",
      });
    }

    if ((dashboardStats?.totalWatchTimeSec || 0) >= 1800) {
      badges.push({
        title: "Focused Learner",
        desc: "Watched at least 30 minutes of content",
      });
    }

    if ((dashboardStats?.completedVideos || 0) >= 3) {
      badges.push({
        title: "Video Finisher",
        desc: "Completed 3 or more videos",
      });
    }

    if (quizAttempts.length >= 3) {
      badges.push({
        title: "Quiz Explorer",
        desc: "Attempted multiple AI quizzes",
      });
    }

    if (overall.streakDays >= 3) {
      badges.push({
        title: "Streak Builder",
        desc: `Maintained a ${overall.streakDays}-day activity streak`,
      });
    }

    if (overall.completedPlaylists >= 1) {
      badges.push({
        title: "Playlist Master",
        desc: "Completed an entire playlist",
      });
    }

    return badges;
  }, [overall, dashboardStats, quizAttempts]);

  const topWeakTopics = useMemo(() => {
    return deriveWeakTopics(quizAttempts).slice(0, 5);
  }, [quizAttempts]);

  const sortedGoals = useMemo(() => {
    return [...goals].sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
    );
  }, [goals]);

  const getCertificateForPlaylist = (playlist) => {
    return (
      certificates.find(
        (cert) =>
          cert?.type === "platform" &&
          (cert?.metadata?.playlistId === playlist._id ||
            cert?.courseName === playlist.name)
      ) || null
    );
  };

  const handleIssueCertificate = async (playlist) => {
    try {
      setIssuingCertificateId(playlist._id);

      const existing = getCertificateForPlaylist(playlist);
      if (existing) return;

      await createCertificate({
        title: `${playlist.name} Completion Certificate`,
        platform: "Interactive Learning Platform",
        type: "platform",
        courseName: playlist.name,
        issuedBy: "Interactive Learning Platform",
        completionDate: new Date().toISOString(),
        metadata: {
          playlistId: playlist._id,
          playlistName: playlist.name,
        },
      });

      await loadPage();
    } catch (error) {
      console.error("Issue certificate error:", error);
    } finally {
      setIssuingCertificateId("");
    }
  };

  const handleDeleteCertificate = async (certificateId) => {
    try {
      await deleteCertificate(certificateId);
      await loadPage();
    } catch (error) {
      console.error("Delete certificate error:", error);
    }
  };

  const copyCertificateId = async (certificateId) => {
    try {
      await navigator.clipboard.writeText(certificateId);
    } catch (error) {
      console.error("Copy certificate id error:", error);
    }
  };

  return (
    <div className="min-h-screen text-[var(--text)]">
      <div className="section-container py-6 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Learning Progress</p>
            <h1 className="text-2xl font-bold md:text-3xl">Progress</h1>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={loadPage}>
              Refresh
            </Button>
            <Button onClick={() => navigate("/workspace")}>Open Workspace</Button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4)">
          <StatCard
            icon={ListVideo}
            title="Playlists"
            value={loading ? "--" : overall.totalPlaylists}
            note="Total playlists in your library"
            tone="blue"
          />
          <StatCard
            icon={CheckCircle2}
            title="Completed"
            value={loading ? "--" : overall.completedPlaylists}
            note="Playlists fully completed"
            tone="emerald"
          />
          <StatCard
            icon={Flame}
            title="Streak"
            value={loading ? "--" : `${overall.streakDays} days`}
            note="Derived from recent tracked activity"
            tone="amber"
          />
          <StatCard
            icon={Award}
            title="Certificates Ready"
            value={loading ? "--" : overall.certificateEligible}
            note="Completed playlists eligible for certificate"
            tone="violet"
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard
            title="Playlist Overview"
            subtitle="Track completion, resume learning, and identify weak areas"
            right={
              <div className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                Progress Mode
              </div>
            }
          >
            <div className="space-y-4">
              {playlistTrackers.length ? (
                playlistTrackers.map((playlist) => (
                  <motion.div
                    key={playlist._id}
                    whileHover={{ y: -4 }}
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{playlist.name}</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted">
                            {playlist.completedVideos}/{playlist.totalVideos} completed
                          </span>
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted">
                            {formatDuration(playlist.totalWatchTimeSec)}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${
                              playlist.isCompleted
                                ? "bg-emerald-500/10 text-emerald-300"
                                : playlist.isInProgress
                                ? "bg-blue-500/10 text-blue-300"
                                : "bg-white/5 text-muted"
                            }`}
                          >
                            {playlist.isCompleted
                              ? "Completed"
                              : playlist.isInProgress
                              ? "In progress"
                              : "Not started"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {playlist.nextVideo ? (
                          <Button
                            onClick={() =>
                              navigate(`/workspace/${playlist.nextVideo.videoId}`)
                            }
                          >
                            Resume
                          </Button>
                        ) : null}

                        {playlist.nextVideo ? (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              navigate(`/workspace/${playlist.nextVideo.videoId}`)
                            }
                          >
                            <ArrowUpRight size={16} />
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs text-muted">
                        <span>Completion</span>
                        <span>{playlist.completionPercent}%</span>
                      </div>

                      <div className="h-2 rounded-full bg-white/5">
                        <div
                          className="h-2 rounded-full bg-[linear-gradient(90deg,#4f8cff,#8b5cf6)]"
                          style={{ width: `${playlist.completionPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <p className="text-sm text-muted">Remaining Videos</p>
                        <p className="mt-2 text-xl font-bold">
                          {playlist.remainingVideos}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <p className="text-sm text-muted">Quiz Attempts</p>
                        <p className="mt-2 text-xl font-bold">
                          {playlist.quizAttemptsCount}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <p className="text-sm text-muted">Last Activity</p>
                        <p className="mt-2 text-sm font-medium">
                          {playlist.lastWatchedAt
                            ? new Date(playlist.lastWatchedAt).toLocaleString()
                            : "No activity yet"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-sm font-medium">Weak Topics</p>

                      {playlist.weakTopics.length ? (
                        <div className="flex flex-wrap gap-2">
                          {playlist.weakTopics.map((topic) => (
                            <span
                              key={`${playlist._id}-${topic.topic}`}
                              className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs text-rose-300"
                            >
                              {topic.topic} • {topic.mistakes}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted">
                          No weak-topic data yet for this playlist.
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-muted">
                  No playlists found. Create or import a playlist from the workspace.
                </div>
              )}
            </div>
          </SectionCard>

          <div className="grid gap-6">
            <SectionCard
              title="Badges"
              subtitle="Derived from your current learning progress"
            >
              <div className="space-y-3">
                {earnedBadges.length ? (
                  earnedBadges.map((badge, index) => (
                    <motion.div
                      key={`${badge.title}-${index}`}
                      whileHover={{ y: -2 }}
                      className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                          <Trophy size={16} />
                        </div>
                        <div>
                          <p className="font-medium">{badge.title}</p>
                          <p className="mt-1 text-sm text-muted">{badge.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted">No badges unlocked yet.</p>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Study Goals"
              subtitle="Track and complete your learning targets"
              right={
                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                  {sortedGoals.filter((goal) => goal.status === "completed").length} completed
                </div>
              }
            >
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-500/10 p-3">
                    <Target size={18} className="text-emerald-300" />
                  </div>
                  <div>
                    <p className="font-semibold">Create Goal</p>
                    <p className="text-sm text-muted">
                      Add a study target to track on your progress page.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <input
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="Goal title"
                    className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
                  />

                  <textarea
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                    rows={3}
                    placeholder="Goal description (optional)"
                    className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      type="number"
                      min="1"
                      value={goalDailyMinutes}
                      onChange={(e) =>
                        setGoalDailyMinutes(Math.max(1, Number(e.target.value) || 30))
                      }
                      placeholder="Daily minutes"
                      className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
                    />

                    <input
                      type="date"
                      value={goalTargetDate}
                      onChange={(e) => setGoalTargetDate(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm outline-none"
                    />
                  </div>

                  <button
                    onClick={handleCreateGoal}
                    disabled={goalSaving || !goalTitle.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#10b981,#059669)] px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-70"
                  >
                    <Plus size={16} />
                    {goalSaving ? "Creating..." : "Create Goal"}
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {goalsLoading ? (
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-muted">
                    Loading goals...
                  </div>
                ) : sortedGoals.length ? (
                  sortedGoals.map((goal) => {
                    const completed = goal.status === "completed";

                    return (
                      <div
                        key={goal._id}
                        className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{goal.title}</p>

                              <span
                                className={`rounded-full px-3 py-1 text-xs ${
                                  completed
                                    ? "bg-emerald-500/10 text-emerald-300"
                                    : "bg-white/5 text-muted"
                                }`}
                              >
                                {completed ? "Completed" : "Active"}
                              </span>
                            </div>

                            {goal.description ? (
                              <p className="text-sm text-muted">{goal.description}</p>
                            ) : null}

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs text-muted">
                                {goal.dailyMinutes || 0} min/day
                              </span>

                              {goal.targetDate ? (
                                <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs text-muted">
                                  <span className="inline-flex items-center gap-1">
                                    <CalendarDays size={12} />
                                    {new Date(goal.targetDate).toLocaleDateString()}
                                  </span>
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {!completed ? (
                              <button
                                onClick={() => handleCompleteGoal(goal._id)}
                                className="rounded-xl border border-emerald-500/20 p-2 text-emerald-300 transition hover:border-emerald-500/30"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            ) : null}

                            <button
                              onClick={() => handleDeleteGoal(goal._id)}
                              className="rounded-xl border border-rose-500/20 p-2 text-rose-300 transition hover:border-rose-500/30"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-muted">
                    No study goals yet.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Overall Weak Topics"
              subtitle="Based on wrong answers from saved quiz history"
            >
              <div className="space-y-3">
                {topWeakTopics.length ? (
                  topWeakTopics.map((item) => (
                    <div
                      key={item.topic}
                      className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-300">
                          <AlertTriangle size={16} />
                        </div>
                        <div>
                          <p className="font-medium">{item.topic}</p>
                          <p className="text-sm text-muted">Needs revision</p>
                        </div>
                      </div>

                      <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted">
                        {item.mistakes} mistakes
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">
                    No weak-topic insights yet. Attempt more quizzes.
                  </p>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Certificates"
              subtitle="Issue and manage real completion certificates"
            >
              <div className="space-y-3">
                {playlistTrackers.filter((item) => item.isCompleted).length ? (
                  playlistTrackers
                    .filter((item) => item.isCompleted)
                    .map((item) => {
                      const existingCertificate = getCertificateForPlaylist(item);

                      return (
                        <div
                          key={`cert-${item._id}`}
                          className="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/10 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                                <BookOpenCheck size={16} />
                              </div>
                              <div>
                                <p className="font-medium text-emerald-300">{item.name}</p>
                                <p className="mt-1 text-sm text-emerald-200/80">
                                  {existingCertificate
                                    ? `Issued • ${existingCertificate.certificateId}`
                                    : "Playlist complete. Ready to issue certificate."}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {existingCertificate ? (
                                <>
                                  <button
                                    onClick={() =>
                                      copyCertificateId(existingCertificate.certificateId)
                                    }
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:border-white/20"
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <Copy size={14} />
                                      Copy ID
                                    </span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleDeleteCertificate(existingCertificate._id)
                                    }
                                    className="rounded-xl border border-rose-500/20 px-3 py-2 text-sm text-rose-300 transition hover:border-rose-500/30"
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleIssueCertificate(item)}
                                  disabled={issuingCertificateId === item._id}
                                  className="rounded-xl bg-[linear-gradient(135deg,#10b981,#059669)] px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-70"
                                >
                                  {issuingCertificateId === item._id
                                    ? "Issuing..."
                                    : "Issue Certificate"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-sm text-muted">
                    Complete a playlist to unlock certificate issuance.
                  </p>
                )}
              </div>

              <div className="mt-5">
                <p className="mb-3 text-sm font-medium">Issued Certificates</p>

                {certificatesLoading ? (
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-muted">
                    Loading certificates...
                  </div>
                ) : certificates.length ? (
                  <div className="space-y-3">
                    {certificates.map((cert) => (
                      <div
                        key={cert._id}
                        className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{cert.title}</p>
                            <p className="mt-1 text-sm text-muted">
                              {cert.courseName || cert.platform}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {cert.certificateId} •{" "}
                              {cert.completionDate
                                ? new Date(cert.completionDate).toLocaleDateString()
                                : "No date"}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => copyCertificateId(cert.certificateId)}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:border-white/20"
                            >
                              <span className="inline-flex items-center gap-2">
                                <Copy size={14} />
                                Copy ID
                              </span>
                            </button>

                            <button
                              onClick={() => handleDeleteCertificate(cert._id)}
                              className="rounded-xl border border-rose-500/20 px-3 py-2 text-sm text-rose-300 transition hover:border-rose-500/30"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-sm text-muted">
                    No certificates issued yet.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}