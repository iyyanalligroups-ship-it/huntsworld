// sockets/complaintNotificationSocket.js
module.exports = (io) => {
  console.log("Complaint namespace initialized");

  // Store io globally for controllers
  global.complaintIo = io;

  io.on("connection", (socket) => {
    console.log(`[Complaint] Connected: ${socket.id}`);

    socket.on("joinAdmin", () => {
      socket.join("admin-complaints");
      console.log(`[Complaint] Admin joined room: admin-complaints (socket: ${socket.id})`);
    });

    socket.on("disconnect", () => {
      console.log(`[Complaint] Disconnected: ${socket.id}`);
    });
  });
};