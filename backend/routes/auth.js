const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const auth = require("../middleware/auth");
const env = require("../config/env");

const router = express.Router();
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    authProvider: user.authProvider || "local",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    level: user.level || 0,
    unlockedFeatures: user.unlockedFeatures || { communityAccess: false, directConnect: false },
    streak: user.stats?.streakDays || 0
  };
}

async function sendResetEmail(to, resetUrl) {
  if (!env.MAIL_HOST || !env.MAIL_USER || !env.MAIL_PASS) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: env.MAIL_HOST,
    port: Number(env.MAIL_PORT || 587),
    secure: String(env.MAIL_SECURE) === "true",
    auth: {
      user: env.MAIL_USER,
      pass: env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: env.MAIL_FROM || env.MAIL_USER,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Reset your password</h2>
        <p>Click the button below to reset your password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#4f8cff;color:#fff;text-decoration:none;border-radius:8px">
            Reset Password
          </a>
        </p>
        <p>This link expires in 15 minutes.</p>
      </div>
    `,
  });

  return true;
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        ok: false,
        error: "All fields are required",
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    if (cleanName.length < 2) {
      return res.status(400).json({
        ok: false,
        error: "Name must be at least 2 characters",
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        ok: false,
        error: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        ok: false,
        error: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash: hashedPassword,
      authProvider: "local",
    });

    await user.updateLevel();
    const token = signToken(user);

    return res.status(201).json({
      ok: true,
      message: "User registered successfully",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Register error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Registration failed",
      details: err.message,
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email and password required",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({
        ok: false,
        error: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        ok: false,
        error: "Wrong password",
      });
    }

    user.lastLoginAt = new Date();
    await user.updateLevel();

    const token = signToken(user);

    return res.json({
      ok: true,
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Login failed",
      details: err.message,
    });
  }
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "Email is required",
      });
    }

    const genericResponse = {
      ok: true,
      message: "If an account exists, a reset link has been sent.",
    };

    const user = await User.findOne({ email });
    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${env.FRONTEND_URL}/reset-password/${rawToken}`;

    let mailed = false;
    try {
      mailed = await sendResetEmail(user.email, resetUrl);
    } catch (mailErr) {
      console.error("Reset mail error:", mailErr.message);
    }

    return res.json({
      ...genericResponse,
      ...(process.env.NODE_ENV !== "production"
        ? { devResetUrl: resetUrl, mailed }
        : {}),
    });
  } catch (err) {
    console.error("Forgot password error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to process forgot password request",
      details: err.message,
    });
  }
});

// Reset password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const rawToken = String(req.params.token || "");
    const password = String(req.body?.password || "");

    if (!rawToken || !password) {
      return res.status(400).json({
        ok: false,
        error: "Token and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        ok: false,
        error: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        error: "Reset link is invalid or expired",
      });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.json({
      ok: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("Reset password error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to reset password",
      details: err.message,
    });
  }
});

// Google login
router.post("/google", async (req, res) => {
  try {
    const credential = req.body?.credential;

    if (!credential) {
      return res.status(400).json({
        ok: false,
        error: "Google credential is required",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload?.email_verified) {
      return res.status(400).json({
        ok: false,
        error: "Google account email is not verified",
      });
    }

    const cleanEmail = String(payload.email).trim().toLowerCase();

    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const randomPasswordHash = await bcrypt.hash(
        crypto.randomBytes(24).toString("hex"),
        10
      );

      user = await User.create({
        name: payload.name || cleanEmail.split("@")[0],
        email: cleanEmail,
        passwordHash: randomPasswordHash,
        googleId: payload.sub,
        authProvider: "google",
        avatar: payload.picture || undefined,
      });
    } else {
      user.googleId = payload.sub;
      user.authProvider = "google";
      await user.updateLevel();
    }

    const token = signToken(user);

    return res.json({
      ok: true,
      message: "Google login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Google login error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Google login failed",
      details: err.message,
    });
  }
});

// Current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "_id name email createdAt updatedAt authProvider level unlockedFeatures stats"
    );

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "User not found",
      });
    }

    return res.json({
      ok: true,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Auth /me error:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to fetch current user",
      details: err.message,
    });
  }
});

module.exports = router;