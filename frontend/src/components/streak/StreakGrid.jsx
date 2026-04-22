import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import ActivityHeatmap from "../dashboard/ActivityHeatmap";
import { getStreak } from "../../services/activityService";

export default function StreakGrid() {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    activityMap: {},
  });

  const loadStreak = async () => {
    try {
      const res = await getStreak();
      if (res.ok) {
        setStreakData({
          currentStreak: res.currentStreak || 0,
          longestStreak: res.longestStreak || 0,
          activityMap: res.activityMap || {},
        });
      }
    } catch (err) {
      console.error("Failed to load streak data", err);
    }
  };

  useEffect(() => {
    loadStreak();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass premium-border rounded-[2rem] p-6 lg:p-10 flex flex-col gap-8 w-full max-w-5xl mx-auto items-center"
    >
      <div className="w-full flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs text-orange-300 font-bold uppercase tracking-wider">
            <Flame size={14} /> Tracking Enabled
          </div>
          <h3 className="text-3xl font-black text-white tracking-tight">Your Progress</h3>
          <p className="mt-1 text-sm text-muted">Keep up the momentum to reach your goals.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="rounded-[1.5rem] border border-white/5 bg-white/5 p-5 min-w-[140px] text-center shadow-xl shadow-orange-500/5">
            <p className="text-xs text-muted uppercase tracking-widest font-bold">Current Streak</p>
            <p className="mt-2 flex items-baseline justify-center gap-1 text-4xl font-black text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              {streakData.currentStreak} <span className="text-base font-normal text-muted">days</span>
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/5 bg-white/5 p-5 min-w-[140px] text-center shadow-xl shadow-blue-500/5">
            <p className="text-xs text-muted uppercase tracking-widest font-bold">Longest Streak</p>
            <p className="mt-2 flex items-baseline justify-center gap-1 text-4xl font-black text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              {streakData.longestStreak} <span className="text-base font-normal text-muted">days</span>
            </p>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4 scrollbar-hide flex justify-center">
        <ActivityHeatmap activityMap={streakData.activityMap} />
      </div>
    </motion.div>
  );
}
