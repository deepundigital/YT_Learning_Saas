import React, { useState, useEffect, useRef } from "react";
import { Send, Smile, Paperclip, MoreVertical, Search, Phone, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";

export default function ChatBox({ selectedUser, currentUser, socket, messages, onSendMessage }) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    if (socket && selectedUser) {
      socket.emit("typing", {
        senderId: currentUser.id,
        receiverId: selectedUser._id
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        // Here you could emit a stop typing event if desired
      }, 3000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedUser) return;
    
    onSendMessage(inputValue);
    setInputValue("");
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white/[0.02] rounded-3xl border-2 border-dashed border-white/5 mx-4 my-4">
        <div className="p-6 rounded-full bg-blue-500/10 text-blue-400 mb-6 relative">
          <Send size={48} className="translate-x-1 -translate-y-1" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping"></div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Student Community Chat</h3>
        <p className="text-muted max-w-sm">Select a student from the sidebar to start a real-time conversation. Share doubts, learning resources and collaborate.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-3xl overflow-hidden glass border border-white/5">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={selectedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`}
              alt={selectedUser.name}
              className="w-12 h-12 rounded-xl object-cover"
            />
            {selectedUser.online && (
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">{selectedUser.name}</h3>
            <p className="text-xs text-muted">
              {selectedUser.online ? (
                <span className="text-emerald-400 font-medium">Online</span>
              ) : (
                "Last seen recently"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition"><Phone size={20} /></button>
          <button className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition"><Video size={20} /></button>
          <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
          <button className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg._id || index}
              message={msg}
              isMine={msg.sender === currentUser.id || msg.senderId === currentUser.id}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-6 pt-2">
        <form 
          onSubmit={handleSubmit}
          className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 px-4 focus-within:border-blue-500/50 transition-all shadow-inner"
        >
          <button type="button" className="p-2 rounded-lg text-muted hover:text-blue-400 transition">
            <Smile size={24} />
          </button>
          <button type="button" className="p-2 rounded-lg text-muted hover:text-blue-400 transition">
            <Paperclip size={22} />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={`Message ${selectedUser.name}...`}
            className="flex-1 bg-transparent py-3 focus:outline-none text-white placeholder:text-muted/60"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className={`p-3 rounded-xl transition-all shadow-lg ${
              inputValue.trim() 
                ? "bg-blue-600 text-white shadow-blue-500/30 active:scale-95" 
                : "bg-white/5 text-muted cursor-default"
            }`}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
