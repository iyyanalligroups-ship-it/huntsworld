module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`🟡 [Notifications] Connected: ${socket.id}`);

    socket.on("join-notification", (userId) => {
      socket.join(`notification:${userId}`);
      console.log(`User ${userId} joined notification room`);
    });

    socket.on("send-notification", ({ receiverId, title, message }) => {
      io.to(`notification:${receiverId}`).emit("receive-notification", { title, message });
    });

    socket.on("disconnect", () => {
      console.log(`🟡 [Notifications] Disconnected: ${socket.id}`);
    });
  });
};
