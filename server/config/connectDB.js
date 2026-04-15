const mongoose = require("mongoose");

const connectDB = () => {
  if (!process.env.MONGO_URI) {
    throw new Error("Please provide MONGO_URI in .env");
  }

  return mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("🟢 MongoDB connected successfully");
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err);
      throw err;
    });
};

module.exports = connectDB;
