module.exports = (io, onlineUsers, lastSeenMap) => {
  io.on("connection", (socket) => {
    console.log(`🟢 [Messages] Client connected: ${socket.id}`);

    socket.on("join", (userId) => {
      socket.join(userId);
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} joined room ${userId}`);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    // Handle joinChatRoom for frontend compatibility
    socket.on("joinChatRoom", ({ userId, selectedUserId }) => {
      socket.join(userId);
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} joined room ${userId} for chat with ${selectedUserId}`);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("typing", ({ senderId, receiverId }) => {
      socket.to(receiverId).emit("typing", senderId);
    });

    socket.on("stopTyping", ({ senderId, receiverId }) => {
      socket.to(receiverId).emit("stopTyping", senderId);
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        lastSeenMap.set(socket.userId, new Date().toISOString());
        io.emit("user-disconnected", {
          userId: socket.userId,
          lastSeen: lastSeenMap.get(socket.userId),
        });
        io.emit("online-users", Array.from(onlineUsers.keys()));
      }
      console.log(`🟢 [Messages] Disconnected: ${socket.id}`);
    });
  });
};