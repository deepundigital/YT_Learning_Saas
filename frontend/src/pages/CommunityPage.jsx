import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserCheck, UserPlus, Search, MessageSquare, Loader2, Info, Flame, Trophy } from "lucide-react";
import axios from "axios";
import UserCard from "../components/community/UserCard";
import ChatBox from "../components/community/ChatBox";
import RequestPanel from "../components/community/RequestPanel";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const API_BASE = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || BACKEND_URL;

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("all"); 
  const [students, setStudents] = useState([]);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); // List of user IDs
  const selectedChatUserRef = useRef(null);

  useEffect(() => {
    selectedChatUserRef.current = selectedChatUser;
  }, [selectedChatUser]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const id = user._id || user.id;
    const token = localStorage.getItem("token");
    setCurrentUser({ ...user, id, _id: id });

    // Initialize socket
    const newSocket = io(SOCKET_URL, {
      auth: { userId: id, token },
      transports: ["websocket"],
      withCredentials: true
    });

    setSocket(newSocket);
    console.log("[Socket Init] Connecting to:", SOCKET_URL, "with UserID:", id);

    newSocket.on("connect", () => {
      console.log("[Socket Success] Connected with socket ID:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("[Socket Error] Connection failed:", err.message);
    });

    newSocket.on("onlineUsers", (userIds) => {
      console.log("Online users updated:", userIds);
      setOnlineUsers(userIds);
    });

    newSocket.on("newMessage", (msg) => {
      setMessages((prev) => {
        const currentChatUser = selectedChatUserRef.current;
        if (currentChatUser && (msg.sender === currentChatUser._id || msg.receiver === currentChatUser._id)) {
           return [...prev, msg];
        }
        return prev;
      });
    });

    newSocket.on("new_request", (data) => {
      if (data.receiverId === id) {
        fetchRequests();
      }
    });

    newSocket.on("request_accepted", (data) => {
      if (data.senderId === id || data.receiverId === id) {
        fetchConnections();
        fetchRequests();
      }
    });

    newSocket.on("connection_removed", (data) => {
      if (data.userId1 === id || data.userId2 === id) {
        fetchConnections();
      }
    });

    fetchInitialData();

    return () => {
      newSocket.off("newMessage");
      newSocket.disconnect();
    };
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const [studentsRes, connectionsRes, requestsRes, leaderboardRes] = await Promise.all([
        axios.get(`${API_BASE}/community/users`, { headers }),
        axios.get(`${API_BASE}/community/connections`, { headers }),
        axios.get(`${API_BASE}/community/requests`, { headers }),
        axios.get(`${API_BASE}/community/leaderboard`, { headers })
      ]);

      console.log("[API] Fetched users response:", studentsRes.data);
      console.log("[API] Fetched connections response:", connectionsRes.data);
      console.log("[API] Fetched requests response:", requestsRes.data);
      console.log("[API] Fetched leaderboard response:", leaderboardRes.data);

      setStudents(studentsRes.data.users || (Array.isArray(studentsRes.data) ? studentsRes.data : []));
      setConnections(Array.isArray(connectionsRes.data) ? connectionsRes.data : []);
      setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
    } catch (err) {
      console.error("Error fetching community data:", err);
    } finally {
      setLoading(false);
    }
  };


  const fetchRequests = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.get(`${API_BASE}/community/requests`, { headers });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  const fetchConnections = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const res = await axios.get(`${API_BASE}/community/connections`, { headers });
      setConnections(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching connections:", err);
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
      }
      fetchInitialData();
    } catch (err) {
      console.error("Error responding to request:", err);
    }
  };

  const handleSendMessage = async (content) => {
    if (!selectedChatUser || !socket) return;
    try {
      socket.emit("sendMessage", {
        receiverId: selectedChatUser._id,
        message: content
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              { id: "leaderboard", label: "Leaderboard", icon: Trophy },
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

          {activeTab === "leaderboard" && (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="glass premium-border rounded-2xl p-4 bg-blue-500/5 border-blue-500/10">
                <div className="flex items-center gap-3">
                  <Trophy className="text-yellow-500" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-white">Global Leaderboard</h3>
                    <p className="text-[10px] text-muted">Ranked by overall XP</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                {leaderboard.map((user, index) => (
                  <div 
                    key={user._id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      user._id === currentUser?._id 
                      ? "bg-blue-600/10 border-blue-500/50" 
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="w-8 flex justify-center font-black text-lg italic text-white/20">
                      #{index + 1}
                    </div>
                    <div className="relative">
                      <img 
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                        className="w-10 h-10 rounded-xl" 
                        alt="" 
                      />
                      {onlineUsers.includes(user._id) && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{user.name}</p>
                      <p className="text-[10px] text-muted truncate">@{user.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-400">{user.stats?.xp || 0} XP</p>
                      <div className="flex items-center justify-end gap-1">
                        <Flame size={10} className="text-orange-400" />
                        <span className="text-[10px] font-bold text-orange-400">{user.stats?.streakDays || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
