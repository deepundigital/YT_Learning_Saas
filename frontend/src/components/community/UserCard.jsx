import React from "react";
import { motion } from "framer-motion";
import { UserPlus, UserCheck, Flame, Clock } from "lucide-react";

export default function UserCard({ student, onConnect, connectionStatus }) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass premium-border rounded-2xl p-5 flex flex-col items-center text-center space-y-4"
    >
      <div className="relative">
        <img
          src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`}
          alt={student.name}
          className="w-20 h-20 rounded-2xl border-2 border-blue-500/30 object-cover"
        />
        {student.online && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-white truncate max-w-[150px]">
          {student.name}
        </h3>
        <p className="text-xs text-muted">@{student.username}</p>
      </div>

      <div className="flex items-center gap-4 w-full justify-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-orange-400">
            <Flame size={16} />
            <span className="font-bold">{student.stats?.streakDays || 0}</span>
          </div>
          <span className="text-[10px] text-muted uppercase">Streak</span>
        </div>
        <div className="w-[1px] h-8 bg-white/10"></div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-blue-400">
            <Clock size={16} />
            <span className="font-bold">{Math.floor((student.stats?.totalWatchTimeSec || 0) / 3600)}h</span>
          </div>
          <span className="text-[10px] text-muted uppercase">Learning</span>
        </div>
      </div>

      {student.bio && (
        <p className="text-xs text-muted line-clamp-2 italic px-2">"{student.bio}"</p>
      )}

      <button
        onClick={() => onConnect(student._id)}
        disabled={connectionStatus === "pending" || connectionStatus === "accepted"}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
          connectionStatus === "accepted"
            ? "bg-white/5 text-emerald-400 cursor-default"
            : connectionStatus === "pending"
            ? "bg-white/5 text-muted cursor-default"
            : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
        }`}
      >
        {connectionStatus === "accepted" ? (
          <>
            <UserCheck size={18} />
            <span>Connected</span>
          </>
        ) : connectionStatus === "pending" ? (
          <span>Requested</span>
        ) : (
          <>
            <UserPlus size={18} />
            <span>Connect</span>
          </>
        )}
      </button>
    </motion.div>
  );
}
