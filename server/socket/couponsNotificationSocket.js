// couponsNotificationSocket.js
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Coupons] Client connected: ${socket.id}`);

    // Join user-specific room
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined coupon room: ${userId}`);
    });

    // FIXED: Listen for new redemption and broadcast
    socket.on("newRedemption", (notification) => {
      const userId = notification.userId || notification.redeemPointsId?.user_id?._id;
      if (userId) {
        console.log(`Emitting newRedemption to user: ${userId}`);
        io.to(userId).emit("newRedemption", notification);
      }
    });

    // Optional: Handle notification update (mark as read)
    socket.on("notificationUpdated", (data) => {
      const userId = data.userId;
      if (userId) {
        console.log(`Broadcasting notificationUpdated to: ${userId}`);
        io.to(userId).emit("notificationUpdated", data);
      }
    });

    // Keep your existing sendMessage if needed
    socket.on("sendMessage", (messageData) => {
      const { senderId, receiverId } = messageData;
      io.to(receiverId).emit("receiveMessage", messageData);
      io.to(senderId).emit("messageSent", messageData);
    });

    socket.on("disconnect", () => {
      console.log(`[Coupons] Disconnected: ${socket.id}`);
    });
  });
};