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
      : ["http://localhost:5173"],
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
    // Use the same ID extraction logic as the auth middleware
    socket.userId = decoded.id || decoded._id || decoded.userId;
    next();
  } catch (err) {
    console.error("Socket authentication error:", err.message);
    return next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.userId);
  onlineUsers.set(socket.userId, socket.id);
  
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  console.log("Online users:", Array.from(onlineUsers.keys()));

  socket.on("sendMessage", async ({ receiverId, message }) => {
    try {
      const newMessage = await Message.create({
        sender: socket.userId,
        receiver: receiverId,
        content: message,
      });
      
      console.log("Message sent by", socket.userId, "to", receiverId, ":", message);

      const receiverSocketId = onlineUsers.get(receiverId);
      console.log("Receiver socket found:", receiverSocketId ? "YES" : "NO", "(Socket ID:", receiverSocketId, ")");

      // SEND TO RECEIVER
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
        console.log("Emitted newMessage to receiver:", receiverId);
      }

      // SEND BACK TO SENDER (IMPORTANT)
      socket.emit("newMessage", newMessage);
    } catch (err) {
      console.error("Message save error:", err);
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
