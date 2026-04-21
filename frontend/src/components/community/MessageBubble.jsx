import React from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";

export default function MessageBubble({ message, isMine }) {
  const date = new Date(message.createdAt || Date.now());
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Handle both field names 'content' (from DB) and 'message' (from Socket)
  const text = message.message || message.content || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[80%] space-y-1 ${isMine ? "items-end" : "items-start"}`}>
        <div
          className={`px-5 py-3 rounded-[1.25rem] relative ${
            isMine
              ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10"
              : "bg-white/5 text-gray-100 rounded-tl-none border border-white/5"
          }`}
        >
          <p className="text-[14px] leading-relaxed select-text font-medium">{text}</p>
          <div className={`mt-1 flex items-center justify-end gap-1.5 opacity-60`}>
             <span className="text-[9px] font-bold uppercase tracking-widest">{time}</span>
             {isMine && (
               message.seen ? <CheckCheck size={11} className="text-blue-200" /> : <Check size={11} />
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
