const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Connection = require("../models/Connection");
const Message = require("../models/Message");

// Get all students (paginated and searchable)
router.get("/students", auth, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user.userId || req.user.id;

    const query = { _id: { $ne: currentUserId } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const students = await User.find(query)
      .select("name username avatar bio stats")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments(query);

    res.json({
      students,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connection system
router.post("/connect", auth, async (req, res) => {
  try {
    const senderId = req.user.userId || req.user.id;
    const { receiverId } = req.body;

    const connection = new Connection({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    await connection.save();
    res.json({ ok: true, message: "Connection request sent" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/connection-respond", auth, async (req, res) => {
  try {
    const { connectionId, status } = req.body;
    const connection = await Connection.findById(connectionId);

    if (!connection) return res.status(404).json({ error: "Not found" });

    connection.status = status;
    await connection.save();
    res.json({ ok: true, message: `Connection ${status}` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/connections", auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const connections = await Connection.find({
      $or: [
        { sender: userId, status: "accepted" },
        { receiver: userId, status: "accepted" },
      ],
    }).populate("sender receiver", "name username avatar streak bio");

    res.json(connections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// Chat system history
router.get("/messages/:userId", auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId || req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(50);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/messages", auth, async (req, res) => {
  try {
    const senderId = req.user.userId || req.user.id;
    const { receiverId, content } = req.body;

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
    });

    await message.save();
    res.json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
