const mongoose = require("mongoose");
const env = require("./env");

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log("MongoDB already connected");
    return mongoose.connection;
  }

  try {
    console.log("Connecting to MongoDB...");

    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    mongoose.set("strictQuery", true);

    await mongoose.connect(env.MONGO_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // fail fast if DB not reachable
    });

    isConnected = true;
    console.log("MongoDB connected successfully");

    mongoose.connection.on("connected", () => {
      console.log("Mongoose event: connected");
    });

    mongoose.connection.on("error", (error) => {
      console.error("Mongoose event error:", error.message);
    });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.warn("Mongoose event: disconnected");
    });

    return mongoose.connection;

  } catch (error) {
    console.error("Failed to connect to MongoDB");
    console.error(error.message);
    process.exit(1); // 🔥 important: crash cleanly in production
  }
}

module.exports = connectDB;