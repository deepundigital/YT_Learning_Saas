import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Target, CalendarDays, CheckSquare } from "lucide-react";
import ActivityHeatmap from "./ActivityHeatmap";
import TaskSystem from "./TaskSystem";
import TimetableSystem from "./TimetableSystem";
import { getStreak } from "../../services/activityService";

function SectionCard({ title, icon: Icon, children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`glass premium-border rounded-[2rem] p-6 flex flex-col ${className}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-white/5 p-2">
          <Icon className="text-blue-300" size={18} />
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </motion.div>
  );
}

export default function DashboardExtras() {
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
    <div className="mt-6 flex flex-col gap-6">
      {/* Streak & Activity Heatmap Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="glass premium-border rounded-[2rem] p-6 md:p-8"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs text-orange-300">
              <Flame size={14} /> Activity Tracking
            </div>
            <h3 className="text-2xl font-bold">Learning Consistency</h3>
            <p className="mt-1 text-sm text-muted">Track your daily task completion streak</p>
          </div>
          
          <div className="flex gap-4">
            <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 min-w-[120px]">
              <p className="text-xs text-muted uppercase tracking-wider font-semibold">Current Streak</p>
              <p className="mt-1 flex items-baseline gap-1 text-3xl font-black text-orange-400">
                {streakData.currentStreak} <span className="text-base font-normal text-muted">days</span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 min-w-[120px]">
              <p className="text-xs text-muted uppercase tracking-wider font-semibold">Longest Streak</p>
              <p className="mt-1 flex items-baseline gap-1 text-3xl font-black text-blue-400">
                {streakData.longestStreak} <span className="text-base font-normal text-muted">days</span>
              </p>
            </div>
          </div>
        </div>

        <ActivityHeatmap activityMap={streakData.activityMap} />
      </motion.div>

      {/* Task & Timetable Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard title="Today's Tasks" icon={CheckSquare} className="h-[400px]">
          <TaskSystem onTaskCompleted={loadStreak} />
        </SectionCard>
        
        <SectionCard title="Timetable" icon={CalendarDays} className="h-[400px]">
          <TimetableSystem />
        </SectionCard>
      </div>
    </div>
  );
}
