
const socketIo = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

// Socket modules
const messageSocket = require("./messageSocket");
const notificationSocket = require("./notificationSocket");
const couponSocket = require("./couponsNotificationSocket");
const trustSealSocket = require("./trustSealNotificationSocket");
const requirementSocket = require("./requirementSocket");
const phoneNumberAccessSocket = require("./phoneNumberAccessSocket");
const subadminAccessSocket = require("./subadminAccessRequestSocket");
const complaintSocket = require("./complaintNotificationSocket");
const contactNotificationSocket = require("./contactNotificationSocket");
const merchantNotificationSocket = require("./merchantNotificationSocket"); // ← new
const onlineUsers = new Map();
const lastSeenMap = new Map();

let ioInstance;

// ================== REDIS ADAPTER (OPTIONAL) ==================
const setupRedisAdapter = async (io) => {
  try {
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));

    console.log("🟢 Redis adapter connected");
  } catch (err) {
    console.warn("⚠️ Redis unavailable, continuing without adapter");
  }
};

// ================== SOCKET INIT ==================
const initSocket = async (server, app) => {
  const io = socketIo(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL,
        process.env.PRODUCTION_URL,
        "http://localhost:5173",
        "http://localhost:5174",  // ← Admin panel
        "http://localhost:5175",  // ← Fallback Vite port
        "http://localhost:5176",  // ← Fallback Vite port
        "https://demo.huntsworld.com",
        "https://huntsworld.com",
      ],
      credentials: true,
    },
    transports: ["websocket"],
  });

  // 🔹 Attach Redis adapter WITHOUT blocking
  if (process.env.ENABLE_REDIS_SOCKET === "true") {
    setupRedisAdapter(io); // NOT awaited
  }

  ioInstance = io;
  app.set("io", io);
  global.io = io;

  // ================== NAMESPACES ==================
  messageSocket(io.of("/messages"), onlineUsers, lastSeenMap);
  notificationSocket(io.of("/notifications"));
  couponSocket(io.of("/coupons"));
  trustSealSocket(io.of("/trust-seal-notifications"));
  requirementSocket(io.of("/requirements"));
  phoneNumberAccessSocket(io.of("/phone-number-access-notifications"));
  subadminAccessSocket(io.of("/access-request-notifications"));
  complaintSocket(io.of("/complaints"));
  const contactsNamespace = io.of("/contacts");
  contactNotificationSocket(contactsNamespace);

  const adminNamespace = io.of("/admin-notifications");
  const adminNotificationSocket = require("./adminNotificationSocket");
  const adminHelpers = adminNotificationSocket(adminNamespace);
  app.set("adminSocketHelpers", adminHelpers);

  const merchantNamespace = io.of("/merchant-notifications");
  const merchantHelpers = merchantNotificationSocket(merchantNamespace);
  app.set("merchantSocketHelpers", merchantHelpers);

  if (process.env.NODE_ENV !== "production") {
    console.log("🟢 Socket.IO initialized");
  }
};

const getIo = () => {
  if (!ioInstance) {
    console.error("❌ Socket.IO not initialized");
    return null;
  }
  return ioInstance;
};

module.exports = {
  initSocket,
  getIo,
  onlineUsers,
};
