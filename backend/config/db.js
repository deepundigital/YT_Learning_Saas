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
    console.log("MONGO_URI:", env.MONGO_URI);

    mongoose.set("strictQuery", true);

    await mongoose.connect(env.MONGO_URI, {
      autoIndex: true
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
    throw error;
  }
}

module.exports = connectDB;