const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Connection = require("../models/Connection");
const Message = require("../models/Message");

// [GET] /api/community/users
router.get("/users", auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId || req.user.id;
    const { search } = req.query;

    const query = { _id: { $ne: currentUserId } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    let selectFields = "name username avatar bio stats level";
    
    const users = await User.find(query)
      .select(selectFields)
      .lean();

    res.json({
      success: true,
      users
    });
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// [GET] /api/community/leaderboard
router.get("/leaderboard", auth, async (req, res) => {
  try {
    const { sortBy = "xp" } = req.query;
    
    let sortObj = {};
    if (sortBy === "streak") sortObj = { "stats.streakDays": -1 };
    else if (sortBy === "videos") sortObj = { "stats.completedVideos": -1 };
    else sortObj = { "stats.xp": -1 };

    const topUsers = await User.find({ isActive: true })
      .select("name username avatar stats level bio")
      .sort(sortObj)
      .limit(20)
      .lean();

    res.json({
      success: true,
      leaderboard: topUsers
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
});

// [POST] /send-request
router.post("/send-request", auth, async (req, res) => {
  try {
    const senderId = req.user.userId || req.user.id;
    const { receiverId } = req.body;
    
    if (!receiverId) return res.status(400).json({ error: "Receiver ID required" });

    // Check existing
    const existing = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existing) return res.status(400).json({ error: "Connection already exists or pending" });

    const connection = new Connection({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    await connection.save();

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("new_request", { senderId, receiverId });
      }
    }

    res.json({ success: true, message: "Connection request sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [POST] /accept-request
router.post("/accept-request", auth, async (req, res) => {
  try {
    const { connectionId } = req.body;
    const connection = await Connection.findById(connectionId);

    if (!connection) return res.status(404).json({ error: "Connection not found" });

    connection.status = "accepted";
    await connection.save();

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const senderSocketId = onlineUsers.get(connection.sender.toString());
      const receiverSocketId = onlineUsers.get(connection.receiver.toString());
      
      if (senderSocketId) {
        io.to(senderSocketId).emit("request_accepted", { senderId: connection.sender, receiverId: connection.receiver });
      }
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("request_accepted", { senderId: connection.sender, receiverId: connection.receiver });
      }
    }

    res.json({ success: true, message: "Request accepted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [POST] /remove-connection
router.post("/remove-connection", auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.userId || req.user.id;

    await Connection.findOneAndDelete({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    });

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const targetSocketId = onlineUsers.get(userId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("connection_removed", { userId1: currentUserId, userId2: userId });
      }
    }

    res.json({ success: true, message: "Connection removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [GET] /requests
router.get("/requests", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const requests = await Connection.find({
      receiver: userId,
      status: "pending",
    }).populate("sender", "name username avatar");

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [GET] /connections
router.get("/connections", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const connections = await Connection.find({
      $or: [
        { sender: userId, status: "accepted" },
        { receiver: userId, status: "accepted" },
      ],
    }).populate("sender receiver", "name username avatar bio stats");

    const users = connections.map(c => {
      const other = c.sender._id.toString() === userId.toString() ? c.receiver : c.sender;
      return { ...other.toObject(), connectionId: c._id };
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [GET] /api/community/messages/:userId
router.get("/messages/:userId", auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId || req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [POST] Internal Message Saving
router.post("/messages", auth, async (req, res) => {
  try {
    const senderId = req.user.userId || req.user.id;
    const { receiverId, message } = req.body;

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      content: message,
    });

    await newMessage.save();
    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
