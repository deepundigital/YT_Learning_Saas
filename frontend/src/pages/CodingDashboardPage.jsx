import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Settings,
  PlusCircle,
  TrendingUp,
  ChevronRight,
  Zap
} from "lucide-react";
import Button from "../components/common/Button";
import {
  updateCodingProfiles,
  getCodingDashboardStats,
  markProblemSolved,
  getSocialLeaderboard,
  getUpcomingContests,
  getTodayActivity,
  updateCodingStrategy
} from "../services/codingService";

const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function CodingDashboardPage() {
  const [activeTab, setActiveTab] = useState("stats"); // 'stats', 'strategy', 'social', 'contests'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats State
  const [profiles, setProfiles] = useState({ leetcode: "", codeforces: "", codechef: "", gfg: "", codingninjas: "", tuf: "" });
  const [stats, setStats] = useState({ leetcode: null, codeforces: null, codechef: null, gfg: null, codingninjas: null, tuf: null });
  const [strategy, setStrategy] = useState("");
  const [aiFeedback, setAiFeedback] = useState(null);
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
    const token = localStorage.getItem("token");
    const socket = io(BACKEND_URL, {
      auth: { userId: currentUser._id, token },
      transports: ["websocket"],
      withCredentials: true
    });

    socket.on("activityUpdated", (data) => {
      if (activeTab === "social") {
        fetchSocialLeaderboard();
      }
      if (data.userId === currentUser._id) {
        setActivityToday(prev => ({...prev, [data.platform]: { solved: true, count: data.problemsCount }}));
      }
    });

    return () => socket.disconnect();
  };

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      await Promise.all([
        fetchStats(),
        fetchTodayActivity(),
        fetchSocialLeaderboard(),
        fetchContestsList()
      ]);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
        setProfiles(res.profiles || { leetcode: "", codeforces: "", codechef: "", gfg: "", codingninjas: "", tuf: "" });
        setStats(res.stats || {});
        setStrategy(res.strategy || "");
        setAiFeedback(res.aiFeedback || null);
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
      setRefreshing(true);
      await updateCodingProfiles(profiles);
      await fetchStats(); 
      alert("Profiles saved successfully!");
    } catch (err) {
      alert("Failed to save profiles.");
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveStrategy = async () => {
    try {
      setRefreshing(true);
      await updateCodingStrategy(strategy);
      alert("Strategy saved!");
    } catch (err) {
      alert("Failed to save strategy.");
    } finally {
      setRefreshing(false);
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

  const getPlatformLink = (platform, username) => {
    if (!username) return "#";
    switch(platform) {
      case 'leetcode': return `https://leetcode.com/${username}`;
      case 'codeforces': return `https://codeforces.com/profile/${username}`;
      case 'codechef': return `https://www.codechef.com/users/${username}`;
      case 'gfg': return `https://www.geeksforgeeks.org/user/${username}/`;
      case 'codingninjas': return `https://www.naukri.com/code360/profile/${username}`;
      default: return "#";
    }
  };

  const renderStats = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="text-blue-400" size={24} /> Performance Overview
        </h2>
        <button 
          onClick={() => loadData(true)} 
          className={`text-xs flex items-center gap-1 text-muted hover:text-white transition ${refreshing ? 'animate-pulse' : ''}`}
        >
          <Zap size={14} /> {refreshing ? "Refreshing..." : "Sync Now"}
        </button>
      </div>

      {aiFeedback && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass premium-border rounded-[2rem] p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
              <Code2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                AI Coding Mentor <span className="text-[10px] uppercase tracking-widest bg-blue-500 text-white px-2 py-0.5 rounded-full">Pro Advice</span>
              </h3>
              <p className="text-sm text-blue-100/80 leading-relaxed italic">
                "{aiFeedback}"
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass premium-border rounded-[2rem] p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings size={20} className="text-muted" /> Connected Accounts
            </h3>
            <div className="space-y-4">
              {[
                { id: 'leetcode', label: 'LeetCode', placeholder: 'username' },
                { id: 'codeforces', label: 'Codeforces', placeholder: 'handle' },
                { id: 'codechef', label: 'CodeChef', placeholder: 'username' },
                { id: 'gfg', label: 'GeeksforGeeks', placeholder: 'username' },
                { id: 'codingninjas', label: 'Coding Ninjas', placeholder: 'handle' },
                { id: 'tuf', label: 'TUF Profile', placeholder: 'profile link' }
              ].map(p => (
                <div key={p.id}>
                  <label className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1 block">{p.label}</label>
                  <input 
                    value={profiles[p.id] || ""} 
                    onChange={e => setProfiles({...profiles, [p.id]: e.target.value})}
                    className="w-full rounded-xl border border-white/5 bg-black/40 px-4 py-2 text-sm outline-none focus:border-blue-500/50 transition"
                    placeholder={p.placeholder}
                  />
                </div>
              ))}
              <Button onClick={handleSaveProfiles} className="w-full mt-2" loading={refreshing}>
                <Save size={16} className="mr-2" /> Save & Sync
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass premium-border rounded-[1.5rem] p-5 flex flex-col items-center text-center">
              <Flame className="text-orange-400 mb-2" size={24} />
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Current Streak</p>
              <h4 className="text-3xl font-black">{currentStreak} <span className="text-xs font-normal text-muted">days</span></h4>
            </div>
            <div className="glass premium-border rounded-[1.5rem] p-5 flex flex-col items-center text-center">
              <Trophy className="text-blue-400 mb-2" size={24} />
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Longest Streak</p>
              <h4 className="text-3xl font-black">{longestStreak} <span className="text-xs font-normal text-muted">days</span></h4>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          {/* LeetCode Card */}
          <div className="glass premium-border rounded-[1.5rem] p-6 group hover:bg-white/[0.02] transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-bold text-yellow-500 mb-1">LeetCode</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black">{stats.leetcode?.totalSolved || 0}</h4>
                  <span className="text-sm text-muted">solved</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {activityToday.leetcode?.solved ? (
                  <span className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 size={10}/> ACTIVE</span>
                    <span className="text-[10px] text-muted font-bold">{activityToday.leetcode.count} solved today</span>
                  </span>
                ) : (
                  <button onClick={() => handleMarkSolved('leetcode')} className="text-[10px] font-bold text-muted hover:text-white bg-white/5 px-2 py-1 rounded-full transition">MARK SOLVED</button>
                )}
                {profiles.leetcode && (
                  <a href={getPlatformLink('leetcode', profiles.leetcode)} target="_blank" rel="noreferrer" className="text-muted hover:text-blue-400 transition">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-4 text-[10px] font-bold">
              <div className="text-emerald-400 bg-emerald-400/5 px-2 py-1 rounded-lg">EASY: {stats.leetcode?.easySolved || 0}</div>
              <div className="text-yellow-400 bg-yellow-400/5 px-2 py-1 rounded-lg">MED: {stats.leetcode?.mediumSolved || 0}</div>
              <div className="text-red-400 bg-red-400/5 px-2 py-1 rounded-lg">HARD: {stats.leetcode?.hardSolved || 0}</div>
            </div>
          </div>

          {/* Codeforces Card */}
          <div className="glass premium-border rounded-[1.5rem] p-6 group hover:bg-white/[0.02] transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-bold text-blue-500 mb-1">Codeforces</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black">{stats.codeforces?.rating || "N/A"}</h4>
                  <span className="text-sm text-muted">rating</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {activityToday.codeforces?.solved ? (
                  <span className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 size={10}/> ACTIVE</span>
                    <span className="text-[10px] text-muted font-bold">{activityToday.codeforces.count} solved today</span>
                  </span>
                ) : (
                  <button onClick={() => handleMarkSolved('codeforces')} className="text-[10px] font-bold text-muted hover:text-white bg-white/5 px-2 py-1 rounded-full transition">MARK SOLVED</button>
                )}
                {profiles.codeforces && (
                  <a href={getPlatformLink('codeforces', profiles.codeforces)} target="_blank" rel="noreferrer" className="text-muted hover:text-blue-400 transition">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
            <div className="text-[10px] font-bold text-muted flex gap-3">
              <span>MAX: <span className="text-white">{stats.codeforces?.maxRating || 0}</span></span>
              <span>RANK: <span className="text-white uppercase">{stats.codeforces?.rank || "unrated"}</span></span>
            </div>
          </div>

          {/* GFG Card */}
          <div className="glass premium-border rounded-[1.5rem] p-6 group hover:bg-white/[0.02] transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-bold text-emerald-500 mb-1">GeeksforGeeks</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black">{stats.gfg?.totalSolved || 0}</h4>
                  <span className="text-sm text-muted">solved</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {activityToday.gfg?.solved ? (
                  <span className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 size={10}/> ACTIVE</span>
                    <span className="text-[10px] text-muted font-bold">{activityToday.gfg.count} solved today</span>
                  </span>
                ) : (
                  <button onClick={() => handleMarkSolved('gfg')} className="text-[10px] font-bold text-muted hover:text-white bg-white/5 px-2 py-1 rounded-full transition">MARK SOLVED</button>
                )}
                {profiles.gfg && (
                  <a href={getPlatformLink('gfg', profiles.gfg)} target="_blank" rel="noreferrer" className="text-muted hover:text-blue-400 transition">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
            <div className="text-[10px] font-bold text-muted">
              INSTITUTE RANK: <span className="text-white">{stats.gfg?.rank || "N/A"}</span>
            </div>
          </div>

          {/* CodeChef Card */}
          <div className="glass premium-border rounded-[1.5rem] p-6 group hover:bg-white/[0.02] transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-bold text-rose-500 mb-1">CodeChef</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black">{stats.codechef?.rating || "N/A"}</h4>
                  <span className="text-sm text-muted">rating</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {activityToday.codechef?.solved ? (
                  <span className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 size={10}/> ACTIVE</span>
                    <span className="text-[10px] text-muted font-bold">{activityToday.codechef.count} solved today</span>
                  </span>
                ) : (
                  <button onClick={() => handleMarkSolved('codechef')} className="text-[10px] font-bold text-muted hover:text-white bg-white/5 px-2 py-1 rounded-full transition">MARK SOLVED</button>
                )}
                {profiles.codechef && (
                  <a href={getPlatformLink('codechef', profiles.codechef)} target="_blank" rel="noreferrer" className="text-muted hover:text-blue-400 transition">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
            <div className="text-[10px] font-bold text-muted flex gap-3">
              <span className="text-rose-400">{stats.codechef?.stars || "1★"}</span>
              <span>MAX: <span className="text-white">{stats.codechef?.highestRating || 0}</span></span>
            </div>
          </div>

          {/* Coding Ninjas Card */}
          <div className="glass premium-border rounded-[1.5rem] p-6 group hover:bg-white/[0.02] transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-bold text-orange-500 mb-1">Coding Ninjas</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black">{stats.codingninjas?.totalSolved || 0}</h4>
                  <span className="text-sm text-muted">solved</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {activityToday.codingninjas?.solved ? (
                  <span className="flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 size={10}/> ACTIVE</span>
                    <span className="text-[10px] text-muted font-bold">{activityToday.codingninjas.count} solved today</span>
                  </span>
                ) : (
                  <button onClick={() => handleMarkSolved('codingninjas')} className="text-[10px] font-bold text-muted hover:text-white bg-white/5 px-2 py-1 rounded-full transition">MARK SOLVED</button>
                )}
                {profiles.codingninjas && (
                  <a href={getPlatformLink('codingninjas', profiles.codingninjas)} target="_blank" rel="noreferrer" className="text-muted hover:text-blue-400 transition">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
            <div className="text-[10px] font-bold text-muted">
               RANK: <span className="text-white uppercase">{stats.codingninjas?.rank || "N/A"}</span>
            </div>
          </div>

          {/* Custom Platform / TUF */}
          <div className="glass premium-border rounded-[1.5rem] p-6 border-dashed border-white/10 flex flex-col items-center justify-center text-center opacity-80 hover:opacity-100 transition">
            <PlusCircle className="text-muted mb-2" size={32} />
            <p className="text-xs font-bold text-muted uppercase">Add More Profiles</p>
            <p className="text-[10px] text-muted mt-1">Connect your other coding handles above</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStrategy = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="text-rose-400" size={24} /> Coding Strategy Planner
        </h2>
        <Button onClick={handleSaveStrategy} size="sm" loading={refreshing}>
          <Save size={16} className="mr-2" /> Save Strategy
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="glass premium-border rounded-[2rem] p-1 overflow-hidden h-[500px] flex flex-col">
            <textarea 
              value={strategy}
              onChange={e => setStrategy(e.target.value)}
              placeholder="Draft your coding roadmap here... 
Example:
- Solve 2 LeetCode Mediums daily
- Complete Binary Search on TUF
- Participte in Saturday Biweekly contest
- Review GFG articles on DP"
              className="flex-1 bg-transparent p-8 text-lg outline-none resize-none font-medium leading-relaxed"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass premium-border rounded-[2rem] p-6 bg-rose-500/5">
            <h4 className="font-bold mb-4 text-rose-400 flex items-center gap-2">
              <Target size={18} /> Daily Goal
            </h4>
            <div className="space-y-3">
              {['leetcode', 'gfg', 'codeforces'].map(p => (
                <div key={p} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-xs font-bold uppercase">{p}</span>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={activityToday[p]?.solved} readOnly className="rounded border-white/10 bg-black/40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass premium-border rounded-[2rem] p-6">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <ChevronRight size={18} className="text-blue-400" /> Quick Links
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <a href="https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2nd-edition/" target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium transition flex items-center justify-between">
                Striver A2Z Sheet <ExternalLink size={12} />
              </a>
              <a href="https://leetcode.com/problemset/all/" target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium transition flex items-center justify-between">
                LeetCode Problems <ExternalLink size={12} />
              </a>
              <a href="https://www.geeksforgeeks.org/explore?page=1&sortBy=submissions&itm_source=geeksforgeeks&itm_medium=main_header&itm_campaign=practice_header" target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium transition flex items-center justify-between">
                GFG Practice <ExternalLink size={12} />
              </a>
            </div>
          </div>
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
          <h1 className="text-3xl font-black md:text-4xl">Coding Dashboard</h1>
          <p className="text-muted mt-2">Connect your profiles, plan your strategy, and track daily progress across all major platforms.</p>
        </div>

        {/* Custom Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 p-1 rounded-2xl bg-white/5 border border-white/5 w-fit">
          {[
            { id: 'stats', label: 'My Stats', icon: TrendingUp },
            { id: 'strategy', label: 'Strategy Planner', icon: Target },
            { id: 'social', label: 'Leaderboard', icon: Trophy },
            { id: 'contests', label: 'Contests', icon: Calendar }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeTab === tab.id ? 'bg-white/10 text-white shadow-lg' : 'text-muted hover:text-white hover:bg-white/5'}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-muted text-sm font-medium">Syncing with coding platforms...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'stats' && renderStats()}
              {activeTab === 'strategy' && renderStrategy()}
              {activeTab === 'social' && renderSocial()}
              {activeTab === 'contests' && renderContests()}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
