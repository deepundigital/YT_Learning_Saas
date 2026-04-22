import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import {
  Code2,
  Trophy,
  Target,
  Flame,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Save,
  Clock,
  Settings
} from "lucide-react";
import Button from "../components/common/Button";
import {
  updateCodingProfiles,
  getCodingDashboardStats,
  markProblemSolved,
  getSocialLeaderboard,
  getUpcomingContests,
  getTodayActivity
} from "../services/codingService";

const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function CodingDashboardPage() {
  const [activeTab, setActiveTab] = useState("stats"); // 'stats', 'social', 'contests'
  const [loading, setLoading] = useState(true);

  // Stats State
  const [profiles, setProfiles] = useState({ leetcode: "", codeforces: "", codechef: "", tuf: "" });
  const [stats, setStats] = useState({ leetcode: null, codeforces: null, codechef: null, tuf: null });
  const [activityToday, setActivityToday] = useState({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Social State
  const [activeUsers, setActiveUsers] = useState([]);

  // Contests State
  const [contests, setContests] = useState([]);

  useEffect(() => {
    loadData();
    setupSocket();
  }, []);

  const setupSocket = () => {
    const socket = io(BACKEND_URL, {
      auth: { userId: currentUser._id },
      transports: ["websocket"],
      withCredentials: true
    });

    socket.on("activityUpdated", (data) => {
      if (activeTab === "social") {
        fetchSocialLeaderboard();
      }
      if (data.userId === currentUser._id) {
        setActivityToday(prev => ({...prev, [data.platform]: true}));
      }
    });

    return () => socket.disconnect();
  };

  const loadData = async () => {
    setLoading(true);
    await fetchStats();
    await fetchTodayActivity();
    await fetchSocialLeaderboard();
    await fetchContestsList();
    setLoading(false);
  };

  const fetchTodayActivity = async () => {
    try {
      const res = await getTodayActivity();
      if (res.ok) setActivityToday(res.activityToday || {});
    } catch (err) {
      console.error("Failed to fetch today activity", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await getCodingDashboardStats();
      if (res.ok) {
        setProfiles(res.profiles || { leetcode: "", codeforces: "", codechef: "", tuf: "" });
        setStats(res.stats || {});
        setCurrentStreak(res.currentStreak || 0);
        setLongestStreak(res.longestStreak || 0);
      }
    } catch (err) {
      console.error("Failed to fetch coding stats", err);
    }
  };

  const fetchSocialLeaderboard = async () => {
    try {
      const res = await getSocialLeaderboard();
      if (res.ok) {
        setActiveUsers(res.activeUsers || []);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    }
  };

  const fetchContestsList = async () => {
    try {
      const res = await getUpcomingContests();
      if (res.ok) {
        setContests(res.contests || []);
      }
    } catch (err) {
      console.error("Failed to fetch contests", err);
    }
  };

  const handleSaveProfiles = async () => {
    try {
      await updateCodingProfiles(profiles);
      await fetchStats(); // Refresh stats with new usernames
    } catch (err) {
      console.error("Failed to save profiles", err);
    }
  };

  const handleMarkSolved = async (platform) => {
    try {
      await markProblemSolved(platform);
      await fetchTodayActivity();
      await fetchStats(); 
      await fetchSocialLeaderboard();
    } catch (err) {
      console.error("Failed to mark solved", err);
    }
  };

  const renderStats = () => (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Profile Settings */}
      <div className="glass premium-border rounded-[2rem] p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Settings size={20} className="text-muted" /> Connection Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider font-bold mb-1 block">LeetCode Username</label>
            <input 
              value={profiles.leetcode || ""} 
              onChange={e => setProfiles({...profiles, leetcode: e.target.value})}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-blue-500/50"
              placeholder="e.g. neetcode"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider font-bold mb-1 block">Codeforces Handle</label>
            <input 
              value={profiles.codeforces || ""} 
              onChange={e => setProfiles({...profiles, codeforces: e.target.value})}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-blue-500/50"
              placeholder="e.g. tourist"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider font-bold mb-1 block">CodeChef Username</label>
            <input 
              value={profiles.codechef || ""} 
              onChange={e => setProfiles({...profiles, codechef: e.target.value})}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-blue-500/50"
              placeholder="e.g. codechef_user"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider font-bold mb-1 block">TUF Profile Link</label>
            <input 
              value={profiles.tuf || ""} 
              onChange={e => setProfiles({...profiles, tuf: e.target.value})}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none focus:border-blue-500/50"
              placeholder="https://takeuforward.org/profile/..."
            />
          </div>
          <Button onClick={handleSaveProfiles} className="w-full mt-2">
            <Save size={16} className="mr-2" /> Save & Sync
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4">
        {/* Streak Stats (New) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass premium-border rounded-[1.5rem] p-5 flex flex-col items-center text-center">
            <Flame className="text-orange-400 mb-2" size={24} />
            <p className="text-xs text-muted uppercase tracking-wider font-bold">Current Streak</p>
            <h4 className="text-3xl font-black">{currentStreak} <span className="text-sm font-normal text-muted">days</span></h4>
          </div>
          <div className="glass premium-border rounded-[1.5rem] p-5 flex flex-col items-center text-center">
            <Trophy className="text-blue-400 mb-2" size={24} />
            <p className="text-xs text-muted uppercase tracking-wider font-bold">Longest Streak</p>
            <h4 className="text-3xl font-black">{longestStreak} <span className="text-sm font-normal text-muted">days</span></h4>
          </div>
        </div>

        {/* LeetCode Card */}
        <div className="glass premium-border rounded-[1.5rem] p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-yellow-500 mb-1">LeetCode</p>
              <h4 className="text-2xl font-black">{stats.leetcode?.totalSolved || 0} <span className="text-sm font-normal text-muted">solved</span></h4>
            </div>
            {activityToday.leetcode ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> Active Today</span>
            ) : (
              <button onClick={() => handleMarkSolved('leetcode')} className="flex items-center gap-1 text-xs text-muted hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-full transition">Mark Solved</button>
            )}
          </div>
          <div className="flex gap-4 text-xs">
            <div className="text-emerald-400">Easy: {stats.leetcode?.easySolved || 0}</div>
            <div className="text-yellow-400">Med: {stats.leetcode?.mediumSolved || 0}</div>
            <div className="text-red-400">Hard: {stats.leetcode?.hardSolved || 0}</div>
          </div>
        </div>

        {/* Codeforces Card */}
        <div className="glass premium-border rounded-[1.5rem] p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-blue-500 mb-1">Codeforces</p>
              <h4 className="text-2xl font-black">{stats.codeforces?.rating || "N/A"} <span className="text-sm font-normal text-muted">rating</span></h4>
            </div>
            {activityToday.codeforces ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> Active Today</span>
            ) : (
              <button onClick={() => handleMarkSolved('codeforces')} className="flex items-center gap-1 text-xs text-muted hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-full transition">Mark Solved</button>
            )}
          </div>
          <div className="text-xs text-muted">Max Rating: {stats.codeforces?.maxRating || 0} • Rank: {stats.codeforces?.rank || "unrated"}</div>
        </div>

        {/* CodeChef Card */}
        <div className="glass premium-border rounded-[1.5rem] p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-rose-500 mb-1">CodeChef</p>
              <h4 className="text-2xl font-black">{stats.codechef?.rating || "N/A"} <span className="text-sm font-normal text-muted">rating</span></h4>
            </div>
            {activityToday.codechef ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 size={12}/> Active Today</span>
            ) : (
              <button onClick={() => handleMarkSolved('codechef')} className="flex items-center gap-1 text-xs text-muted hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-full transition">Mark Solved</button>
            )}
          </div>
          <div className="text-xs text-muted">Stars: {stats.codechef?.stars || "None"} • Max Rating: {stats.codechef?.highestRating || 0}</div>
        </div>
      </div>
    </div>
  );

  const renderSocial = () => (
    <div className="glass premium-border rounded-[2rem] p-6 lg:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold mb-2">Today's Leaderboard</h3>
          <p className="text-muted flex items-center gap-2">
            <Flame className="text-orange-400" size={16} /> {activeUsers.length} students coding today
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {activeUsers.map((item, i) => (
          <div key={item.user?._id || i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex flex-col items-center justify-center overflow-hidden border border-white/10">
                {item.user?.avatar ? (
                  <img src={item.user.avatar} className="w-full h-full object-cover" />
                ) : (
                  <Users size={18} className="text-blue-300" />
                )}
              </div>
              <div>
                <p className="font-semibold text-white">{item.user?.name || "Anonymous User"}</p>
                <div className="flex gap-2 mt-1">
                  {item.platforms.map(p => (
                    <span key={p} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-muted">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-emerald-400 flex items-center gap-2">
              <span className="text-sm font-bold">{item.platforms.length}</span>
              <CheckCircle2 size={18} />
            </div>
          </div>
        ))}

        {activeUsers.length === 0 && (
          <div className="text-center py-12 text-muted">
            <Trophy size={48} className="mx-auto mb-4 opacity-20" />
            <p>No one has solved a problem today yet.</p>
            <p className="text-sm mt-2">Be the first to get on the leaderboard!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderContests = () => (
    <div className="glass premium-border rounded-[2rem] p-6 lg:p-10">
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Target size={24} className="text-rose-400" /> Upcoming Contests
      </h3>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contests.map((c, i) => {
          const date = new Date(c.startTimeSeconds * 1000);
          const now = new Date();
          const isToday = date.toDateString() === now.toDateString();
          
          return (
            <div key={i} className={`p-5 rounded-2xl border ${isToday ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/10 bg-white/5'} flex flex-col justify-between`}>
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded bg-black/30 ${c.platform === 'Codeforces' ? 'text-blue-400' : 'text-yellow-400'}`}>
                    {c.platform}
                  </span>
                  {isToday && <span className="text-xs font-bold text-orange-400 animate-pulse">TODAY</span>}
                </div>
                <h4 className="font-bold text-lg leading-tight mb-4">{c.name}</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Calendar size={14} /> {date.toLocaleDateString()} at {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Clock size={14} /> {Math.floor(c.durationSeconds / 3600)}h {(c.durationSeconds % 3600) / 60 > 0 ? `${(c.durationSeconds % 3600) / 60}m` : ''} duration
                </div>
                
                <a href={c.link} target="_blank" rel="noreferrer" className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm font-semibold">
                  View Contest <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )
        })}

        {contests.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-muted">
            <p>No upcoming contests found at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-[var(--text)] pb-20">
      <div className="section-container py-6 md:py-8">
        <div className="mb-8">
          <p className="text-sm text-muted font-semibold tracking-wider uppercase mb-1">Developer Hub</p>
          <h1 className="text-3xl font-black md:text-4xl">Coding Tracker</h1>
          <p className="text-muted mt-2">Connect your profiles, track daily progress, and compete with friends.</p>
        </div>

        {/* Custom Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 p-1 rounded-2xl bg-white/5 border border-white/5 w-fit">
          <button 
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${activeTab === 'stats' ? 'bg-white/10 text-white shadow-lg' : 'text-muted hover:text-white hover:bg-white/5'}`}
          >
            My Stats
          </button>
          <button 
            onClick={() => setActiveTab('social')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${activeTab === 'social' ? 'bg-white/10 text-white shadow-lg' : 'text-muted hover:text-white hover:bg-white/5'}`}
          >
            Leaderboard
          </button>
          <button 
            onClick={() => setActiveTab('contests')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${activeTab === 'contests' ? 'bg-white/10 text-white shadow-lg' : 'text-muted hover:text-white hover:bg-white/5'}`}
          >
            Contests
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'stats' && renderStats()}
            {activeTab === 'social' && renderSocial()}
            {activeTab === 'contests' && renderContests()}
          </motion.div>
        )}
      </div>
    </div>
  );
}
