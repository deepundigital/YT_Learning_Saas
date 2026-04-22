import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Clock3,
  FileText,
  ListVideo,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import Button from "../components/common/Button";
import { getDashboardAnalytics } from "../services/analyticsService";
import { getAllProgress } from "../services/progressService";
import { getPlaylists } from "../services/playlistService";

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

function shortDateLabel(dateKey) {
  try {
    const date = new Date(dateKey);
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return dateKey;
  }
}

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
    .slice(0, 6);
}

function StatCard({ icon: Icon, title, value, note, tone = "blue" }) {
  const toneMap = {
    blue: "bg-blue-500/10 text-blue-300",
    violet: "bg-violet-500/10 text-violet-300",
    cyan: "bg-cyan-500/10 text-cyan-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass premium-border rounded-[1.75rem] p-5"
    >
      <div className={`mb-4 inline-flex rounded-2xl p-3 ${toneMap[tone]}`}>
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
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass premium-border rounded-[2rem] p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">{title}</h3>
          {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({});
  const [recent, setRecent] = useState({});
  const [progressItems, setProgressItems] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const [analyticsRes, progressRes, playlistsRes] = await Promise.all([
        getDashboardAnalytics(),
        getAllProgress(),
        getPlaylists(),
      ]);

      setDashboardStats(analyticsRes?.stats || {});
      setRecent(analyticsRes?.recent || {});
      setProgressItems(progressRes?.progress || []);
      setPlaylists(playlistsRes?.playlists || []);
      setQuizAttempts(getLocalQuizAttempts());
    } catch (error) {
      console.error("Analytics load error:", error);
      setDashboardStats({});
      setRecent({});
      setProgressItems([]);
      setPlaylists([]);
      setQuizAttempts(getLocalQuizAttempts());
    } finally {
      setLoading(false);
    }
  };

  const quizSummary = useMemo(() => {
    const totalAttempts = quizAttempts.length;
    const averageScore =
      totalAttempts > 0
        ? Math.round(
            quizAttempts.reduce(
              (sum, attempt) => sum + Number(attempt?.scorePercent || 0),
              0
            ) / totalAttempts
          )
        : 0;

    return {
      totalAttempts,
      averageScore,
    };
  }, [quizAttempts]);

  const progressByDay = useMemo(() => {
    const map = new Map();

    for (const item of progressItems) {
      const key = normalizeDateKey(item?.lastWatchedAt || item?.updatedAt);
      if (!key) continue;

      const current = map.get(key) || { minutes: 0, completions: 0 };
      current.minutes += Math.round((item?.watchTimeSec || 0) / 60);
      if (item?.completed) current.completions += 1;
      map.set(key, current);
    }

    const keys = Array.from(map.keys()).sort((a, b) => new Date(a) - new Date(b));
    const lastSeven = keys.slice(-7);

    return lastSeven.map((key) => ({
      day: shortDateLabel(key),
      minutes: map.get(key)?.minutes || 0,
      completions: map.get(key)?.completions || 0,
    }));
  }, [progressItems]);

  const playlistProgressData = useMemo(() => {
    const progressMap = new Map();
    for (const item of progressItems) {
      progressMap.set(item.videoId, item);
    }

    return playlists
      .map((playlist) => {
        const videos = playlist?.videos || [];
        const totalVideos = videos.length;

        const completedVideos = videos.filter(
          (video) => progressMap.get(video.videoId)?.completed
        ).length;

        const completionPercent = totalVideos
          ? Math.round((completedVideos / totalVideos) * 100)
          : 0;

        return {
          name: playlist.name?.slice(0, 16) || "Playlist",
          completion: completionPercent,
          totalVideos,
          completedVideos,
        };
      })
      .slice(0, 8);
  }, [playlists, progressItems]);

  const recentTrackedVideos = useMemo(() => {
    return [...progressItems]
      .sort(
        (a, b) =>
          new Date(b?.lastWatchedAt || b?.updatedAt || 0) -
          new Date(a?.lastWatchedAt || a?.updatedAt || 0)
      )
      .slice(0, 6);
  }, [progressItems]);

  const weakTopics = useMemo(() => {
    return deriveWeakTopics(quizAttempts);
  }, [quizAttempts]);

  const averageCompletion = useMemo(() => {
    if (!progressItems.length) return 0;

    const total = progressItems.reduce((sum, item) => {
      if (item?.completed) return sum + 100;

      const duration = Math.max(1, Number(item?.durationSec || 0));
      const position = Number(item?.lastPositionSec || 0);
      return sum + Math.min(100, Math.round((position / duration) * 100));
    }, 0);

    return Math.round(total / progressItems.length);
  }, [progressItems]);

  return (
    <div className="min-h-screen text-[var(--text)]">
      <div className="section-container py-6 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Insights & Performance</p>
            <h1 className="text-2xl font-bold md:text-3xl">Analytics</h1>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={loadAnalytics}>
              Refresh
            </Button>
            <Button onClick={() => navigate("/playlists")}>Progress</Button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Clock3}
            title="Watch Time"
            value={loading ? "--" : formatDuration(dashboardStats.totalWatchTimeSec || 0)}
            note="Total tracked learning time"
            tone="blue"
          />
          <StatCard
            icon={ListVideo}
            title="Tracked Videos"
            value={loading ? "--" : dashboardStats.totalTrackedVideos || 0}
            note="Videos with saved progress"
            tone="violet"
          />
          <StatCard
            icon={BrainCircuit}
            title="Quiz Accuracy"
            value={loading ? "--" : `${quizSummary.averageScore}%`}
            note="Average score across saved quiz attempts"
            tone="cyan"
          />
          <StatCard
            icon={Target}
            title="Avg Completion"
            value={loading ? "--" : `${averageCompletion}%`}
            note="Average progress across tracked videos"
            tone="emerald"
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard
            title="Watch Activity"
            subtitle="Minutes studied over recent active days"
            right={
              <div className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                Real progress data
              </div>
            }
          >
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart
                  data={
                    progressByDay.length
                      ? progressByDay
                      : [{ day: "No data", minutes: 0, completions: 0 }]
                  }
                >
                  <defs>
                    <linearGradient id="analyticsMinutesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f8cff" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#4f8cff" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.92)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="#4f8cff"
                    fill="url(#analyticsMinutesFill)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="completions"
                    stroke="#8b5cf6"
                    fill="transparent"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Playlist Completion"
            subtitle="How far each playlist has progressed"
          >
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={
                    playlistProgressData.length
                      ? playlistProgressData
                      : [{ name: "No data", completion: 0 }]
                  }
                >
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.92)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="completion" radius={[12, 12, 0, 0]} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <SectionCard
            title="Recent Tracked Videos"
            subtitle="Latest videos with progress and watch history"
            right={
              <Button variant="secondary" onClick={() => navigate("/workspace")}>
                Open Workspace
              </Button>
            }
          >
            <div className="grid gap-4">
              {recentTrackedVideos.length ? (
                recentTrackedVideos.map((item, index) => {
                  const progressPercent = item?.completed
                    ? 100
                    : Math.min(
                        100,
                        Math.round(
                          ((item?.lastPositionSec || 0) /
                            Math.max(1, item?.durationSec || 1)) *
                            100
                        )
                      );

                  return (
                    <motion.div
                      key={item?._id || item?.videoId || index}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -3 }}
                      className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="text-lg font-semibold">
                            {item?.title || item?.videoId || "Tracked Video"}
                          </h4>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                              {item?.completed ? "Completed" : "In progress"}
                            </span>

                            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted">
                              {formatDuration(item?.watchTimeSec || 0)}
                            </span>

                            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted">
                              {item?.lastWatchedAt
                                ? new Date(item.lastWatchedAt).toLocaleString()
                                : "No recent activity"}
                            </span>
                          </div>
                        </div>

                        <Button onClick={() => navigate(`/workspace/${item.videoId}`)}>
                          <ArrowUpRight size={16} />
                        </Button>
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-xs text-muted">
                          <span>Progress</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5">
                          <div
                            className="h-2 rounded-full bg-[linear-gradient(90deg,#4f8cff,#8b5cf6)]"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-muted">
                  No tracked videos yet.
                </div>
              )}
            </div>
          </SectionCard>

          <div className="grid gap-6">
            <SectionCard
              title="Quiz Insights"
              subtitle="Performance snapshot from saved quiz attempts"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 inline-flex rounded-2xl bg-violet-500/10 p-3 text-violet-300">
                    <BrainCircuit size={18} />
                  </div>
                  <p className="text-sm text-muted">Quiz Attempts</p>
                  <p className="mt-2 text-3xl font-black">
                    {quizSummary.totalAttempts}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 inline-flex rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                    <Trophy size={18} />
                  </div>
                  <p className="text-sm text-muted">Average Score</p>
                  <p className="mt-2 text-3xl font-black">
                    {quizSummary.averageScore}%
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Weak Topics"
              subtitle="Most frequent weak areas from wrong quiz answers"
            >
              <div className="space-y-3">
                {weakTopics.length ? (
                  weakTopics.map((item) => (
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
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-muted">
                    No weak-topic insights yet.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Recent Activity Snapshot"
              subtitle="Latest notes, bookmarks, and AI interactions"
            >
              <div className="space-y-3">
                {(recent?.notes?.length || recent?.bookmarks?.length || recent?.ai?.length) ? (
                  <>
                    {(recent?.notes || []).slice(0, 2).map((item) => (
                      <div
                        key={`note-${item._id}`}
                        className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="font-medium">{item.title || "Note created"}</p>
                            <p className="mt-1 text-sm text-muted">
                              {item.content || item.youtubeId}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(recent?.bookmarks || []).slice(0, 2).map((item) => (
                      <div
                        key={`bookmark-${item._id}`}
                        className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                            <Sparkles size={16} />
                          </div>
                          <div>
                            <p className="font-medium">{item.label || "Bookmark saved"}</p>
                            <p className="mt-1 text-sm text-muted">
                              {item.note || item.youtubeId}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(recent?.ai || []).slice(0, 2).map((item) => (
                      <div
                        key={`ai-${item._id}`}
                        className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-300">
                            <Activity size={16} />
                          </div>
                          <div>
                            <p className="font-medium">{item.type || "AI interaction"}</p>
                            <p className="mt-1 text-sm text-muted">
                              {typeof item.input === "string"
                                ? item.input
                                : item.youtubeId || "Recent AI activity"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-muted">
                    No recent activity found.
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