import React from "react";
import { Check, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RequestPanel({ requests, onRespond }) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
        <div className="p-4 rounded-full bg-white/5 text-muted/30 mb-4">
          <User size={32} />
        </div>
        <p className="text-muted text-sm">No pending connection requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {requests.map((request) => (
          <motion.div
            key={request._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass premium-border rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <img
                src={request.sender.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.sender.username}`}
                className="w-10 h-10 rounded-xl"
                alt=""
              />
              <div>
                <p className="font-semibold text-white text-sm">{request.sender.name}</p>
                <p className="text-xs text-muted">@{request.sender.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRespond(request._id, "accepted")}
                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition border border-emerald-500/20"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => onRespond(request._id, "rejected")}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition border border-red-500/20"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
