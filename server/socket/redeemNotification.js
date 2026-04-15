module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`🟢 [Redeem] Client connected: ${socket.id}`);

    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined redeem room ${userId}`);
    });

    socket.on("sendMessage", ({ senderId, receiverId, content }) => {
      const redeemObject = {
        _id: new Date().getTime().toString(),
        sender: senderId,
        receiver: receiverId,
        content,
        createdAt: new Date().toISOString(),
      };
      io.to(receiverId).emit("receiveMessage", redeemObject);
      io.to(senderId).emit("messageSent", redeemObject);
    });

    socket.on("disconnect", () => {
      console.log(`🟢 [Redeem] Disconnected: ${socket.id}`);
    });
  });
};