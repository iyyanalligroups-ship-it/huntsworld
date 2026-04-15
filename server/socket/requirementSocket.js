module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`🟡 [Requirements] Connected: ${socket.id}`);

    socket.on("join-requirements", () => {
      socket.join("requirements");
      console.log(`Seller joined requirements room`);
    });

    socket.on("disconnect", () => {
      console.log(`🟡 [Requirements] Disconnected: ${socket.id}`);
    });
  });
};