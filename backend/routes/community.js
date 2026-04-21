const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Connection = require("../models/Connection");
const Message = require("../models/Message");

// Access Control Middlewares
const requireCommunityAccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId || req.user.id);
    if (!user || user.level < 1) {
      return res.status(403).json({ 
        success: false, 
        locked: true,
        message: "Unlock Community after a 10-day streak! 🔥",
        currentStreak: user?.stats?.streakDays || 0
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const requireDirectConnect = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId || req.user.id);
    if (!user || user.level < 2) {
      return res.status(403).json({ 
        success: false, 
        message: "Direct connections unlock at Level 2 (20-day streak)! 🔥" 
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// [GET] /api/community/users
// Fetch all users except logged-in user
// Apply restriction: Level 1 only sees names and streaks.
router.get("/users", auth, requireCommunityAccess, async (req, res) => {
  try {
    const currentUserId = req.user.userId || req.user.id;
    const user = await User.findById(currentUserId);
    const userLevel = user.level || 0;

    const query = { _id: { $ne: currentUserId } };

    // Level 2 filtering: Only show same level
    if (userLevel === 2) {
      query.level = 2;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    // Select fields based on access
    let selectFields = "name username avatar bio stats level";
    
    const users = await User.find(query)
      .select(selectFields)
      .lean();

    res.json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// [POST] /send-request
router.post("/send-request", auth, requireCommunityAccess, async (req, res) => {
  try {
    const senderId = req.user.userId || req.user.id;
    const user = await User.findById(senderId);

    if (user.level < 2) {
      return res.status(403).json({ error: "Connect feature unlocks at Level 2! 🔥" });
    }

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
    res.json({ success: true, message: "Request accepted" });
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

    // Flatten for frontend
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
router.post("/messages", auth, requireCommunityAccess, async (req, res) => {
  try {
    const senderId = req.user.userId || req.user.id;
    const user = await User.findById(senderId);

    if (user.level < 2) {
      return res.status(403).json({ error: "Messaging unlocks at Level 2! 🔥" });
    }

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
