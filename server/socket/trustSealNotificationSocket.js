// trustSealNotificationSocket.js
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`[TrustSeal] Connected: ${socket.id}`);

    // Admin joins this room to receive real-time trust seal notifications
    socket.on("join", (room) => {
      socket.join(room);
      console.log(`[TrustSeal] Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`[TrustSeal] Disconnected: ${socket.id}`);
    });
  });
};