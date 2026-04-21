import React, { useState, useEffect, useMemo, useCallback } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserCheck, UserPlus, Search, MessageSquare, Loader2, Info, Flame } from "lucide-react";
import axios from "axios";
import UserCard from "../components/community/UserCard";
import ChatBox from "../components/community/ChatBox";
import RequestPanel from "../components/community/RequestPanel";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("all"); 
  const [students, setStudents] = useState([]);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); // List of user IDs

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const id = user._id || user.id;
    setCurrentUser({ ...user, id, _id: id });

    // Initialize socket
    const newSocket = io(SOCKET_URL, {
      auth: {
        userId: id
      }
    });

    setSocket(newSocket);
    console.log("Socket connecting with UserID:", id);

    newSocket.on("connect", () => {
      console.log("Socket connected, socket ID:", newSocket.id);
    });

    newSocket.on("online-users", (userIds) => {
      console.log("Online users updated:", userIds);
      setOnlineUsers(userIds);
    });

    newSocket.on("receive_message", (data) => {
      // Only add message if it's from the currently selected chat user
      setMessages((prev) => [...prev, data]);
    });

    fetchInitialData();

    return () => newSocket.disconnect();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const [studentsRes, connectionsRes, requestsRes] = await Promise.all([
        axios.get(`${API_BASE}/community/users`, { headers }),
        axios.get(`${API_BASE}/community/connections`, { headers }),
        axios.get(`${API_BASE}/community/requests`, { headers })
      ]);

      setStudents(studentsRes.data);
      setConnections(connectionsRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      console.error("Error fetching community data:", err);
      if (err.response?.status === 403 && err.response?.data?.locked) {
        // Handled by level check
      }
    } finally {
      setLoading(false);
    }
  };



  const fetchMessages = async (userId) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.get(`${API_BASE}/community/messages/${userId}`, { headers });
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    if (selectedChatUser) {
      fetchMessages(selectedChatUser._id);
    }
  }, [selectedChatUser]);

  const handleConnect = async (receiverId) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      await axios.post(`${API_BASE}/community/send-request`, { receiverId }, { headers });
      fetchInitialData();
    } catch (err) {
      console.error("Error connecting:", err);
    }
  };

  const handleRespond = async (connectionId, status) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      if (status === "accepted") {
        await axios.post(`${API_BASE}/community/accept-request`, { connectionId }, { headers });
      } else {
        // Handle rejection if needed
      }
      fetchInitialData();
    } catch (err) {
      console.error("Error responding to request:", err);
    }
  };

  const handleSendMessage = async (content) => {
    if (!selectedChatUser || !socket) return;
    try {
      const messageData = { 
        senderId: currentUser.id,
        receiverId: selectedChatUser._id, 
        message: content 
      };

      // 1. Send to API for storage
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.post(`${API_BASE}/community/messages`, messageData, { headers });
      
      // 2. Add to local state
      setMessages((prev) => [...prev, res.data]);
      
      // 3. Emit via socket
      socket.emit("send_message", messageData);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLocked = currentUser?.level === 0 || !currentUser?.unlockedFeatures?.communityAccess;

  if (isLocked && !loading) {
     const streak = currentUser?.streak || 0;
     const progress = Math.min(100, (streak / 10) * 100);

     return (
       <div className="h-full flex items-center justify-center p-6">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="max-w-md w-full glass premium-border rounded-[2.5rem] p-8 text-center space-y-8 relative overflow-hidden"
         >
           <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
              />
           </div>

           <div className="mx-auto w-24 h-24 rounded-3xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
             <Flame size={48} className="animate-pulse" />
           </div>

           <div className="space-y-3">
             <h2 className="text-3xl font-black text-white tracking-tight uppercase">Community Locked</h2>
             <p className="text-muted text-sm leading-relaxed">
               Connect with peers and unlock real-time chat by hitting a <span className="text-orange-400 font-bold">10-day learning streak</span>.
             </p>
           </div>

           <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted px-1">
                 <span>Progress</span>
                 <span>{streak} / 10 Days</span>
              </div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                 />
              </div>
           </div>

           <button 
             onClick={() => window.location.href = "/dashboard"}
             className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] transition-all"
           >
             Continue Learning
           </button>
         </motion.div>
       </div>
     );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Left Column: Explorer / Connections */}
      <div className="w-[400px] flex flex-col gap-6">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
               <Users size={24} />
             </div>
             <div>
               <h1 className="text-2xl font-bold text-white tracking-tight">Community</h1>
               <p className="text-muted text-xs">Connect and collaborate with peers.</p>
             </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
            {[
              { id: "all", label: "Discovery", icon: UserPlus },
              { id: "connections", label: "Friends", icon: UserCheck },
              { id: "requests", label: "Requests", icon: Info }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id ? "bg-white/10 text-white shadow-sm" : "text-muted hover:text-white"
                }`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
                {tab.id === "requests" && requests.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white font-bold">{requests.length}</span>
                )}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {activeTab === "all" && (
            <>
              <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide pb-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-muted text-sm">Finding awesome students...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <Users size={48} className="mb-4" />
                    <p>No students found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredStudents.map(student => (
                      <UserCard 
                        key={student._id} 
                        student={student} 
                        onConnect={handleConnect}
                        isOnline={onlineUsers.includes(student._id)}
                        currentUserLevel={currentUser?.level}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "connections" && (
             <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                {connections.length === 0 ? (
                  <div className="text-center py-20 opacity-40">
                    <p>No connections yet</p>
                  </div>
                ) : (
                  connections.map(user => (
                    <motion.button
                      key={user._id}
                      onClick={() => setSelectedChatUser(user)}
                      whileHover={{ scale: 1.01 }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        selectedChatUser?._id === user._id 
                        ? "bg-blue-600/10 border-blue-500/50" 
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="relative">
                        <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-12 h-12 rounded-xl" alt="" />
                        {onlineUsers.includes(user._id) && (
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        )}
                      </div>
                      <div className="text-left flex-1 overflow-hidden">
                        <p className="font-bold text-white text-sm truncate">{user.name}</p>
                        <p className="text-xs text-muted truncate">@{user.username}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <div className="flex items-center gap-1 text-orange-400 text-xs">
                           <span className="font-bold">{user.stats?.streakDays || 0} 🔥</span>
                         </div>
                      </div>
                    </motion.button>
                  ))
                )}
             </div>
          )}

          {activeTab === "requests" && (
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
              <RequestPanel requests={requests} onRespond={handleRespond} />
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Chat Window */}
      <div className="flex-1">
        <ChatBox
          selectedUser={selectedChatUser}
          currentUser={currentUser}
          socket={socket}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
