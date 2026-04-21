import React from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";

export default function MessageBubble({ message, isMine }) {
  const date = new Date(message.createdAt);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[75%] space-y-1 ${isMine ? "items-end" : "items-start"}`}>
        <div
          className={`px-5 py-3 rounded-2xl relative ${
            isMine
              ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/20"
              : "bg-white/5 text-gray-100 rounded-tl-none border border-white/5"
          }`}
        >
          <p className="text-[15px] leading-relaxed select-text">{message.content || message.message}</p>
          <div className={`mt-1 flex items-center justify-end gap-1.5 opacity-60`}>
             <span className="text-[10px]">{time}</span>
             {isMine && (
               message.seen ? <CheckCheck size={12} className="text-blue-200" /> : <Check size={12} />
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
