require("dotenv").config();
const mongoose = require("mongoose");
const createApp = require("./app");
const env = require("./config/env");

const app = createApp();

async function startServer() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB connected");

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
}

startServer();