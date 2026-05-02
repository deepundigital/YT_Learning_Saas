require("dotenv").config();
const dns = require("dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("./config/env");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const createApp = require("./app");
const Message = require("./models/Message");
const { initCron } = require("./cron/syncActivity");

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL 
      ? ["http://localhost:5173", process.env.FRONTEND_URL] 
      : ["https://yt-learning-saas.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket"],
});

if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter connected");
  }).catch((err) => {
    console.error("Redis adapter connection error:", err);
  });
}

// Store online users: Map<userId, socketId>
const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    console.error("[Socket Middleware] Connection rejected: Missing token");
    return next(new Error("Authentication error: Token missing"));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    // Force ID to string to avoid Map mismatch (Object vs String)
    const rawId = decoded.id || decoded._id || decoded.userId;
    socket.userId = String(rawId);
    next();
  } catch (err) {
    console.error("Socket authentication error:", err.message);
    return next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = String(socket.userId);
  console.log(`[Socket] User joined: ${userId} (Socket: ${socket.id})`);
  
  // Update with the latest socket ID for this user
  onlineUsers.set(userId, socket.id);
  
  const onlineIds = Array.from(onlineUsers.keys());
  io.emit("onlineUsers", onlineIds);
  console.log("[Socket] Current online count:", onlineIds.length);

  socket.on("sendMessage", async ({ receiverId, message }) => {
    try {
      const receiverIdStr = String(receiverId);
      const senderIdStr = String(socket.userId);

      const newMessage = await Message.create({
        sender: senderIdStr,
        receiver: receiverIdStr,
        content: message,
      });
      
      console.log(`[Message] ${senderIdStr} -> ${receiverIdStr}: "${message}"`);

      const messageData = newMessage.toObject();
      // Ensure sender and receiver IDs are strings in the emitted object
      messageData.sender = String(messageData.sender);
      messageData.receiver = String(messageData.receiver);

      const receiverSocketId = onlineUsers.get(receiverIdStr);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", messageData);
        console.log(`[Socket] Delivered to receiver socket: ${receiverSocketId}`);
      } else {
        console.log(`[Socket] Receiver ${receiverIdStr} is OFFLINE.`);
      }

      // ALWAYS send back to sender so their UI updates
      socket.emit("newMessage", messageData);
    } catch (err) {
      console.error("[Socket] Message error:", err);
    }
  });

  socket.on("typing", (data) => {
    const { senderId, receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user-typing", { userId: senderId });
    }
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.userId);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    console.log("User disconnected:", socket.userId, "Remaining online:", onlineUsers.size);
  });
});


app.set("io", io);
app.set("onlineUsers", onlineUsers);

// Initialize Cron Jobs
initCron(io);

console.log("==== DEBUG START ====");
console.log("MONGO_URI:", process.env.MONGO_URI ? "Defined" : "MISSING");
console.log("PORT:", process.env.PORT);
if (process.env.YOUTUBE_API_KEY) {
  const key = process.env.YOUTUBE_API_KEY;
  console.log("YOUTUBE_API_KEY: Defined", `(${key.substring(0, 5)}...${key.substring(key.length - 4)})`);
} else {
  console.log("YOUTUBE_API_KEY: MISSING");
}
console.log("==== DEBUG END ====");

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is NOT defined");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
}

startServer();
