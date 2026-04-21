import { useState } from "react";
import { motion } from "framer-motion";

export default function ActivityHeatmap({ activityMap = {} }) {
  // Generate the last 365 days (52 weeks * 7 days)
  const today = new Date();
  
  // We want to end on today, but to make a clean grid let's calculate days
  // Let's generate a full year of days (364 days = 52 weeks)
  const days = [];
  const DAYS_IN_YEAR = 364;
  
  for (let i = DAYS_IN_YEAR - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push(dateStr);
  }

  // To build a GitHub style grid: 7 rows (Sun-Sat), 52 columns.
  // We will simply display it as a flex wrap column-wise if possible, 
  // or just use a grid of 52 columns and 7 rows.
  // A simple way is to use a flex container column-oriented per week.
  
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getColor = (count) => {
    if (!count || count === 0) return "bg-white/5 border-white/5";
    if (count === 1) return "bg-emerald-900 border-emerald-800";
    if (count >= 2 && count <= 3) return "bg-emerald-600 border-emerald-500";
    return "bg-emerald-400 border-emerald-300"; // 4+
  };

  return (
    <div className="flex w-full flex-col overflow-x-auto pb-4">
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wIndex) => (
          <div key={wIndex} className="flex flex-col gap-1">
            {week.map((date) => {
              const count = activityMap[date] || 0;
              return (
                <div
                  key={date}
                  className={`h-3 w-3 sm:h-4 sm:w-4 rounded-sm border ${getColor(
                    count
                  )} transition-colors hover:ring-2 hover:ring-white/50 group relative cursor-pointer`}
                >
                  {/* Simple Tooltip */}
                  <div className="absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100 pointer-events-none">
                    {count} tasks on {date}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-white/5 border border-white/5" />
          <div className="h-3 w-3 rounded-sm bg-emerald-900 border border-emerald-800" />
          <div className="h-3 w-3 rounded-sm bg-emerald-600 border border-emerald-500" />
          <div className="h-3 w-3 rounded-sm bg-emerald-400 border border-emerald-300" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
