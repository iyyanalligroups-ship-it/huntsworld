// subadminAccessRequestSocket.js
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`[SubadminAccess] Connected: ${socket.id}`);

    socket.on("join_admins", () => {
      socket.join("admins");
      console.log(`Socket ${socket.id} joined 'admins' room`);
    });
    socket.on("sendAccessRequest", (notification) => {
      const payload = {
        ...notification,
        is_read: notification.is_read ?? false,
      };
      io.to("admins").emit("newAccessRequest", payload); // ← Use this event
    });
    // FIXED: Emit to all admins
    socket.on("sendAccessRequest", (notification) => {
      console.log("Emitting receiveMessage to admins room");
      io.to("admins").emit("receiveMessage", notification);
    });

    socket.on("disconnect", () => {
      console.log(`[SubadminAccess] Disconnected: ${socket.id}`);
    });
  });
};
