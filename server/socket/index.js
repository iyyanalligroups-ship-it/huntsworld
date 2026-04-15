// const socketIo = require("socket.io");

// const initSocket = (server) => {
//   const io = socketIo(server, {
//     cors: {
//      origin: ["https://demo.huntsworld.com","https://www.demo.huntsworld.com"],
//     },
//   });

//   io.on("connection", (socket) => {
//     console.log(`User connected: ${socket.id}`);


//     socket.on("join", (userId) => {
//       socket.join(userId); // Join user-specific room
//       console.log(`User ${userId} joined room ${socket.id}`);
//     });

//     // Send a message to a specific user
//     socket.on("sendMessage", (messageData) => {
//       const { senderId, receiverId, content } = messageData;
//       console.log(`Message from ${senderId} to ${receiverId}: ${content}`);

//       // Emit message to the receiver
//       io.to(receiverId).emit("receiveMessage", messageData);

//       // Optionally, send a confirmation to the sender
//       io.to(senderId).emit("messageSent", messageData);
//     });

//     // Handle disconnections
//     socket.on("disconnect", () => {
//       console.log("User disconnected");
//     });
//   });

//   return io;
// };

// module.exports = initSocket;
