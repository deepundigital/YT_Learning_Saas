import React, { useState, useEffect, useRef } from "react";
import { Send, Image, MoreVertical, MessageCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";

export default function ChatBox({ selectedUser, currentUser, socket, messages, onSendMessage }) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  if (!selectedUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10">
        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20">
          <MessageCircle size={40} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Select a friend to chat</h3>
        <p className="text-muted text-sm max-w-[280px]">
          Pick someone from your connections to start a real-time conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col glass premium-border rounded-[2rem] overflow-hidden">
      {/* Header */}
      <header className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`} 
              className="w-10 h-10 rounded-xl" 
              alt="" 
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{selectedUser.name}</h4>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Active Now</p>
          </div>
        </div>
        <button className="p-2 hover:bg-white/5 rounded-lg transition text-muted">
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
             <div className="p-4 rounded-full bg-white/5">
                <MessageCircle size={32} />
             </div>
             <p className="text-sm italic">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble 
              key={msg._id || idx} 
              message={msg} 
              isMine={msg.sender === currentUser?.id || msg.senderId === currentUser?.id} 
            />
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-white/[0.02]">
        <div className="relative flex items-center gap-3">
          <button type="button" className="p-2.5 text-muted hover:text-white transition hover:bg-white/5 rounded-xl">
             <Image size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${selectedUser.name}...`}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-blue-600/50 text-white rounded-xl transition shadow-lg shadow-blue-600/20"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
