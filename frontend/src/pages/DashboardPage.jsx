import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bot,
  BrainCircuit,
  Bookmark,
  Clock3,
  FileText,
  Flame,
  LayoutDashboard,
  ListVideo,
  MessageSquare,
  PlayCircle,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import Button from "../components/common/Button";
import ThemeToggle from "../components/common/ThemeToggle";
import { getDashboardAnalytics } from "../services/analyticsService";
import { getPlaylists } from "../services/playlistService";
import DashboardExtras from "../components/dashboard/DashboardExtras";

function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);

  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function truncate(text, max = 28) {
  const value = String(text || "");
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
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

function safeText(value, fallback = "No details") {
  if (value == null) return fallback;
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => safeText(item, "")).join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function describeAIInput(type, input, youtubeId) {
  const normalizedType = String(type || "").toLowerCase();

  if (input && typeof input === "object") {
    if (normalizedType.includes("quiz") && input.count) {
      return `Generated ${input.count}-question quiz`;
    }

    if (normalizedType.includes("summary")) {
      return input.forceRefresh
        ? "Generated fresh summary"
        : "Generated summary";
    }

    if (normalizedType.includes("flashcard") && input.count) {
      return `Generated ${input.count} flashcards`;
    }

    if (
      (normalizedType.includes("ask") || normalizedType.includes("chat")) &&
      input.question
    ) {
      return String(input.question);
    }

    if (
      (normalizedType.includes("ask") || normalizedType.includes("chat")) &&
      input.message
    ) {
      return String(input.message);
    }
  }

  return safeText(input || youtubeId, "Recent AI activity");
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
      const current = topicMap.get(topic) || 0;
      topicMap.set(topic, current + 1);
    }
  }

  return Array.from(topicMap.entries())
    .map(([topic, mistakes]) => ({ topic, mistakes }))
    .sort((a, b) => b.mistakes - a.mistakes)
    .slice(0, 6);
}

function StatCard({ icon: Icon, title, value, note, tone = "blue", loading }) {
  const toneMap = {
    blue: "bg-blue-500/10 text-blue-300",
    violet: "bg-violet-500/10 text-violet-300",
    cyan: "bg-cyan-500/10 text-cyan-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="glass premium-border rounded-[1.75rem] p-5"
    >
      <div className={`mb-4 inline-flex rounded-2xl p-3 ${toneMap[tone]}`}>
        <Icon size={20} />
      </div>

      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">
        {loading ? "--" : value}
      </p>
      <p className="mt-2 text-sm text-muted">{note}</p>
    </motion.div>
  );
}

function SectionCard({ title, subtitle, right, children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`glass premium-border rounded-[2rem] p-6 ${className}`}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
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

export default function DashboardPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [playlistsCount, setPlaylistsCount] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [analyticsRes, playlistsRes] = await Promise.all([
        getDashboardAnalytics(),
        getPlaylists(),
      ]);

      setSummary(analyticsRes || null);
      setPlaylistsCount(playlistsRes?.playlists?.length || 0);
      setQuizAttempts(getLocalQuizAttempts());
    } catch (error) {
      console.error("Dashboard load error:", error);
      setSummary(null);
      setPlaylistsCount(0);
      setQuizAttempts(getLocalQuizAttempts());
    } finally {
      setLoading(false);
    }
  };

  const stats = summary?.stats || {};
  const recent = summary?.recent || {};

  const progressChartData = useMemo(() => {
    const items = recent?.progress || [];
    if (!items.length) {
      return [{ label: "No data", minutes: 0, completion: 0 }];
    }

    return items
      .slice()
      .reverse()
      .map((item, index) => ({
        label: truncate(item?.title || item?.videoId || `Video ${index + 1}`, 18),
        minutes: Math.round((item?.watchTimeSec || 0) / 60),
        completion: item?.completed
          ? 100
          : Math.min(
              100,
              Math.round(
                ((item?.lastPositionSec || 0) /
                  Math.max(1, item?.durationSec || 1)) *
                  100
              )
            ),
      }));
  }, [recent]);

  const distributionData = useMemo(() => {
    return [
      { name: "Notes", value: stats?.totalNotes || 0 },
      { name: "Bookmarks", value: stats?.totalBookmarks || 0 },
      { name: "AI", value: stats?.totalAIInteractions || 0 },
      { name: "Goals", value: stats?.totalGoals || 0 },
      { name: "Playlists", value: playlistsCount || 0 },
    ];
  }, [stats, playlistsCount]);

  const recentStudyItems = useMemo(() => {
    return recent?.progress || [];
  }, [recent]);

  const activityItems = useMemo(() => {
    const ai = (recent?.ai || []).map((item) => ({
      icon: Bot,
      title: `${safeText(item?.type, "AI")} interaction`,
      subtitle: describeAIInput(item?.type, item?.input, item?.youtubeId),
      time: item?.createdAt
        ? new Date(item.createdAt).toLocaleString()
        : "Recently",
    }));

    const notes = (recent?.notes || []).map((item) => ({
      icon: FileText,
      title: safeText(item?.title, "Note created"),
      subtitle: safeText(item?.content || item?.youtubeId, "Recent note"),
      time: item?.createdAt
        ? new Date(item.createdAt).toLocaleString()
        : "Recently",
    }));

    const bookmarks = (recent?.bookmarks || []).map((item) => ({
      icon: Bookmark,
      title: safeText(item?.label, "Bookmark saved"),
      subtitle: safeText(item?.note || item?.youtubeId, "Recent bookmark"),
      time: item?.createdAt
        ? new Date(item.createdAt).toLocaleString()
        : "Recently",
    }));

    return [...ai, ...notes, ...bookmarks].slice(0, 8);
  }, [recent]);

  const quickActions = [
    {
      icon: Sparkles,
      title: "Open Workspace",
      desc: "Continue learning on your current video session.",
      onClick: () => navigate("/workspace/jNQXAC9IVRw"),
    },
    {
      icon: ListVideo,
      title: "Manage Playlists",
      desc: "Import playlists and organize learning paths.",
      onClick: () => navigate("/workspace/jNQXAC9IVRw"),
    },
    {
      icon: BrainCircuit,
      title: "Start Quiz",
      desc: "Practice concepts using AI-generated quizzes.",
      onClick: () => navigate("/workspace/jNQXAC9IVRw"),
    },
    {
      icon: MessageSquare,
      title: "Ask AI",
      desc: "Open chat-based learning and doubt solving.",
      onClick: () => navigate("/workspace/jNQXAC9IVRw"),
    },
  ];

  const weakTopics = useMemo(() => {
    return deriveWeakTopics(quizAttempts);
  }, [quizAttempts]);

  const firstTrackedVideoId = recentStudyItems?.[0]?.videoId || "jNQXAC9IVRw";

  return (
    <div className="min-h-screen text-[var(--text)]">
      <div className="section-container py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="glass rounded-2xl p-3">
              <LayoutDashboard className="text-blue-300" size={20} />
            </div>
            <div>
              <p className="text-sm text-muted">Premium Workspace</p>
              <h1 className="text-xl font-bold md:text-2xl">Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="secondary" onClick={loadDashboard}>
              Refresh
            </Button>
            <Button onClick={() => navigate(`/workspace/${firstTrackedVideoId}`)}>
              New Session
            </Button>
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="glass premium-border relative overflow-hidden rounded-[2.25rem] p-7 md:p-8"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,140,255,0.14),transparent_35%)]" />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.12),transparent_55%)]" />

            <div className="relative z-10 max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                <Sparkles size={16} />
                AI Learning Dashboard
              </div>

              <h2 className="max-w-3xl text-4xl font-black leading-[1] tracking-[-0.04em] md:text-6xl">
                Study smarter with a <span className="gradient-text">real AI workflow.</span>
              </h2>

              <p className="mt-5 max-w-2xl text-sm text-muted md:text-base">
                Track notes, bookmarks, watch progress, goals, and AI interactions
                in one premium learning control center.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  className="gap-2"
                  onClick={() => navigate(`/workspace/${firstTrackedVideoId}`)}
                >
                  Open Workspace
                  <ArrowUpRight size={16} />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/workspace/${firstTrackedVideoId}`)}
                >
                  Continue Last Session
                </Button>
              </div>

              <div className="mt-8 grid max-w-2xl gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-muted">Tracked videos</p>
                  <p className="mt-2 text-2xl font-black">
                    {loading ? "--" : stats.totalTrackedVideos || 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-muted">Playlists</p>
                  <p className="mt-2 text-2xl font-black">
                    {loading ? "--" : playlistsCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-muted">AI interactions</p>
                  <p className="mt-2 text-2xl font-black">
                    {loading ? "--" : stats.totalAIInteractions || 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <SectionCard
            title="This week"
            subtitle="Your momentum at a glance"
            right={
              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                Real backend stats
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 inline-flex rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                  <Flame size={18} />
                </div>
                <p className="text-sm text-muted">Completed goals</p>
                <p className="mt-2 text-3xl font-black">
                  {loading ? "--" : stats.completedGoals || 0}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 inline-flex rounded-2xl bg-violet-500/10 p-3 text-violet-300">
                  <Trophy size={18} />
                </div>
                <p className="text-sm text-muted">Completed videos</p>
                <p className="mt-2 text-3xl font-black">
                  {loading ? "--" : stats.completedVideos || 0}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 inline-flex rounded-2xl bg-blue-500/10 p-3 text-blue-300">
                  <Clock3 size={18} />
                </div>
                <p className="text-sm text-muted">Watch time</p>
                <p className="mt-2 text-3xl font-black">
                  {loading ? "--" : formatDuration(stats.totalWatchTimeSec)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 inline-flex rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                  <TrendingUp size={18} />
                </div>
                <p className="text-sm text-muted">Bookmarks saved</p>
                <p className="mt-2 text-3xl font-black">
                  {loading ? "--" : stats.totalBookmarks || 0}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={PlayCircle}
            title="Videos in library"
            value={stats.totalVideos || 0}
            note="Global indexed videos available"
            tone="blue"
            loading={loading}
          />
          <StatCard
            icon={FileText}
            title="Notes"
            value={stats.totalNotes || 0}
            note="Your saved learning notes"
            tone="violet"
            loading={loading}
          />
          <StatCard
            icon={Bot}
            title="AI usage"
            value={stats.totalAIInteractions || 0}
            note="Questions, chats, and guided answers"
            tone="cyan"
            loading={loading}
          />
          <StatCard
            icon={Target}
            title="Study goals"
            value={stats.totalGoals || 0}
            note="Goals created in your planner"
            tone="emerald"
            loading={loading}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            title="Recent learning progress"
            subtitle="Tracked watch time on your latest videos"
            right={<div className="text-sm text-muted">Real activity</div>}
          >
            <div className="h-[320px] min-h-[320px] w-full min-w-0">
  <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={320}>
                <AreaChart data={progressChartData}>
                  <defs>
                    <linearGradient id="minutesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f8cff" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#4f8cff" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
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
                    fill="url(#minutesFill)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="completion"
                    stroke="#8b5cf6"
                    fill="transparent"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Learning distribution"
            subtitle="How your backend-tracked activity is distributed"
          >
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
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
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <SectionCard
            title="Recent tracked videos"
            subtitle="Jump back into active learning sessions"
            right={
              <Button
                variant="secondary"
                onClick={() => navigate(`/workspace/${firstTrackedVideoId}`)}
              >
                Open workspace
              </Button>
            }
          >
            <div className="grid gap-4">
              {recentStudyItems.length ? (
                recentStudyItems.map((video, index) => {
                  const progressPercent = video?.completed
                    ? 100
                    : Math.min(
                        100,
                        Math.round(
                          ((video?.lastPositionSec || 0) /
                            Math.max(1, video?.durationSec || 1)) *
                            100
                        )
                      );

                  return (
                    <motion.div
                      key={video?._id || video?.videoId || index}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      whileHover={{ y: -4 }}
                      className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-semibold">
                            {video?.title || video?.videoId || "Tracked Video"}
                          </h4>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                              {video?.completed ? "Completed" : "In progress"}
                            </span>
                            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted">
                              {formatDuration(video?.watchTimeSec || 0)}
                            </span>
                          </div>
                        </div>

                        <Button onClick={() => navigate(`/workspace/${video.videoId}`)}>
                          Resume
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
                  No recent tracked videos yet.
                </div>
              )}
            </div>
          </SectionCard>

          <div className="grid gap-6">
            <SectionCard
              title="Recent activity"
              subtitle="Latest AI, notes, and bookmarks"
            >
              <div className="space-y-3">
                {activityItems.length ? (
                  activityItems.map((activity, index) => {
                    const Icon = activity.icon;

                    return (
                      <motion.div
                        key={`${activity.title}-${index}`}
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="flex items-start gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                      >
                        <div className="rounded-2xl bg-white/5 p-3">
                          <Icon className="text-blue-300" size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{activity.title}</p>
                          <p className="mt-1 text-sm text-muted line-clamp-2">
                            {activity.subtitle}
                          </p>
                        </div>
                        <p className="max-w-[110px] text-right text-xs text-muted">
                          {activity.time}
                        </p>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-muted">
                    No recent activity yet.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Quick actions"
              subtitle="Move fast through your workflow"
            >
              <div className="grid gap-3">
                {quickActions.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <motion.button
                      key={item.title}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      whileHover={{ y: -3 }}
                      onClick={item.onClick}
                      className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/20"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300">
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-muted">{item.desc}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="text-muted" size={18} />
                    </motion.button>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Weak Topics"
            subtitle="Derived from wrong quiz answers"
            right={
              <div className="rounded-full bg-rose-500/10 px-3 py-1 text-xs text-rose-300">
                Quiz-based
              </div>
            }
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
                      {item.mistakes} mistake{item.mistakes > 1 ? "s" : ""}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-muted">
                  No weak topics yet. Attempt more quizzes to unlock insights.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Revision Recommendation"
            subtitle="Suggested next step based on your recent quiz pattern"
          >
            <div className="space-y-3">
              {weakTopics.length ? (
                weakTopics.slice(0, 3).map((item, index) => (
                  <div
                    key={`${item.topic}-${index}`}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                  >
                    <p className="font-medium">{item.topic}</p>
                    <p className="mt-1 text-sm text-muted">
                      Rewatch related content, regenerate flashcards, and retry quiz.
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-muted">
                  Keep practicing quizzes to get personalized weak-area recommendations.
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <DashboardExtras />
      </div>
    </div>
  );
}