require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const createApp = require("./app");

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Store online users: Map<userId, socketId>
const onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.handshake.auth?.userId;
  console.log("A user connected:", socket.id, "Auth UserID:", userId);

  if (userId) {
    onlineUsers.set(userId, socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log(`User ${userId} tracked. Total online:`, onlineUsers.size);
  }

  socket.on("send_message", async (data) => {
    const { senderId, receiverId, message } = data;
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive_message", {
        ...data,
        createdAt: new Date()
      });
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
    let disconnectedUserId = null;
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    if (disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    }
    console.log("User disconnected:", socket.id, "Remaining online:", onlineUsers.size);
  });
});


app.set("io", io);

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
