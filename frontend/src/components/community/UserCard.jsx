import React from "react";
import { motion } from "framer-motion";
import { UserPlus, Clock, Flame } from "lucide-react";

export default function UserCard({ student, onConnect, isOnline, currentUserLevel }) {
  const isLevel2 = student.level === 2;
  const isSelfLevel1 = currentUserLevel === 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={`glass premium-border rounded-2xl p-5 group transition-all relative ${isSelfLevel1 && !isLevel2 ? "hover:shadow-none cursor-default" : ""}`}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <img
            src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`}
            className={`w-14 h-14 rounded-2xl object-cover ring-2 ring-white/5 group-hover:ring-blue-500/30 transition-all shadow-xl ${isSelfLevel1 && !isLevel2 ? "" : ""}`}
            alt={student.name}
          />
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-lg font-bold text-white truncate">{student.name}</h3>
            {student.level === 2 ? (
                <div className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[8px] font-black uppercase tracking-widest border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                   Pro 🔥
                </div>
            ) : student.level === 1 ? (
                <div className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">
                   Rising 🚀
                </div>
            ) : null}
          </div>
          <p className="text-xs text-muted font-medium mb-1 truncate">@{student.username}</p>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-muted"}`}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-3 mb-6 bg-white/5 rounded-xl p-3 border border-white/5 ${isSelfLevel1 ? "opacity-100" : ""}`}>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-orange-400">
            <Flame size={16} />
            <span className="font-bold">{student.stats?.streakDays || 0}</span>
          </div>
          <span className="text-[10px] text-muted uppercase font-bold tracking-tight">Streak</span>
        </div>
        <div className="w-[1px] h-8 bg-white/10 self-center"></div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-blue-400">
            <Clock size={16} />
            <span className="font-bold">{Math.floor((student.stats?.totalWatchTimeSec || 0) / 3600)}h</span>
          </div>
          <span className="text-[10px] text-muted uppercase font-bold tracking-tight">Learning</span>
        </div>
      </div>

      {isSelfLevel1 ? (
          <div className="w-full py-3 rounded-xl bg-white/5 text-muted/50 text-[10px] font-bold uppercase text-center border border-dashed border-white/10">
             Unlock Connect at Level 2
          </div>
      ) : (
          <button
            onClick={() => onConnect(student._id)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <UserPlus size={18} />
            <span>Connect</span>
          </button>
      )}
    </motion.div>
  );
}
