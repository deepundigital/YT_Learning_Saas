const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const env = require("../config/env");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    const normalizedEmail = String(email || "").trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        error: "User already exists with this email"
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash
    });

    const token = signToken(user);

    return res.status(201).json({
      ok: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
        stats: user.stats
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    const normalizedEmail = String(email || "").trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        ok: false,
        error: "Invalid email or password"
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        preferences: user.preferences,
        stats: user.stats,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id || req.user._id).select("-passwordHash");
    if (!user || !user.isActive) {
      return res.status(401).json({
        ok: false,
        error: "User not found or deactivated"
      });
    }
    return res.status(200).json({
      ok: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        preferences: user.preferences,
        stats: user.stats,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const allowedFields = ["name", "avatar", "bio", "preferences"];
    const updates = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      returnDocument: 'after',
      runValidators: true
    }).select("-passwordHash");

    return res.status(200).json({
      ok: true,
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateMe
};