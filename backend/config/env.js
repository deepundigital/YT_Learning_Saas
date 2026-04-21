require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || "",
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || "",
  AI_PROVIDER: process.env.AI_PROVIDER || "",
  AI_MODEL: process.env.AI_MODEL || "",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  MAIL_HOST: process.env.MAIL_HOST || "",
  MAIL_PORT: process.env.MAIL_PORT || "587",
  MAIL_SECURE: process.env.MAIL_SECURE || "false",
  MAIL_USER: process.env.MAIL_USER || "",
  MAIL_PASS: process.env.MAIL_PASS || "",
  MAIL_FROM: process.env.MAIL_FROM || "",
};