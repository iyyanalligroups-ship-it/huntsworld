
// ================== CORE IMPORTS ==================
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");
const http = require("http");
require("dotenv").config();

// ================== INTERNAL IMPORTS ==================
const connectDB = require("./config/connectDB");
const { initSocket, onlineUsers } = require("./socket/mainIndex");
const { ensureGlobalOthers } = require("./utils/createGlobalOthers");

// 🔴 NEW: Import Trust Seal Expiry Cron Job
require("./utils/TrustSealExpireJob");
require("./utils/subscriptionPlanExpire");

// ================== APP INIT ==================
const app = express();
const server = http.createServer(app);

// ================== CORS CONFIG ==================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.PRODUCTION_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "https://demo.huntsworld.com",
  "https://www.demo.huntsworld.com",
  "https://huntsworld.com",
  "https://www.huntsworld.com",
  "https://admin.huntsworld.com",
  "https://www.admin.huntsworld.com",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  })
);

// ================== MIDDLEWARE ==================
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ================== GLOBAL DATA ==================
app.set("onlineUsers", onlineUsers);

// ================== HEALTH CHECK ==================
app.get("/", (req, res) => {
  res.send("Server is running! HuntsWorld API is live.");
});

// ================== ROUTES ==================
require("./routes/index")(app);

// ================== LOAD REQUIRED MODELS ==================
require("./models/productQuoteModel");
require("./utils/TrustSealExpireJob");

// ================== SERVER START (🔥 IMMEDIATE) ==================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});

// ================== BACKGROUND INITIALIZATION ==================
connectDB()
  .then(async () => {

    // 🔹 Global setup (run only when needed)
    if (process.env.RUN_GLOBAL_SETUP === "true") {
      setImmediate(async () => {
        try {
          await ensureGlobalOthers();
          console.log("🟢 Global setup completed");
        } catch (err) {
          console.error("❌ Global setup failed:", err);
        }
      });
    }

    // 🔹 Socket initialization (🔥 IMMEDIATE)
    await initSocket(server, app).catch((err) =>
      console.error("❌ Socket init failed:", err)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
  });

// ================== GRACEFUL SHUTDOWN ==================
process.on("SIGINT", () => {
  console.log("🛑 Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => process.exit(0));
  });
});
