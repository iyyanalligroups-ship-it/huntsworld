// module.exports = (io) => {
//   io.on("connection", (socket) => {
//     console.log(`🟡 [PhoneNumberAccess] Connected: ${socket.id}`);

//     socket.on("join", (userId) => {
//       socket.join(userId);
//       console.log(`User ${userId} joined phone number access room: ${socket.id}`);
//     });

//     socket.on("sendMessage", ({ senderId, receiverId, content }) => {
//       io.to(receiverId).emit("receiveMessage", { senderId, receiverId, content });
//     });

//     socket.on("disconnect", () => {
//       console.log(`🟡 [PhoneNumberAccess] Disconnected: ${socket.id}`);
//     });
//   });
// };



// sockets/phoneNumberAccessSocket.js
module.exports = (io) => {
  console.log("PhoneNumberAccess namespace initialized");

  io.on("connection", (socket) => {
    console.log(`[PhoneNumberAccess] Connected: ${socket.id}`);

    // -------------------------------------------------
    // 1. Merchant joins their own room (userId = merchant user _id)
    // -------------------------------------------------
    socket.on("join", (userId) => {
      if (!userId) return;
      socket.join(userId);
      console.log(`[PhoneNumberAccess] User ${userId} joined room (socket: ${socket.id})`);
    });


    // -------------------------------------------------
    // 3. Disconnect
    // -------------------------------------------------
    socket.on("disconnect", (reason) => {
      console.log(`[PhoneNumberAccess] Disconnected: ${socket.id} | ${reason}`);
    });
  });
};