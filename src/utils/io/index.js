import { Server } from "socket.io";

let io;

process.removeAllListeners("warning");

export const initIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3002",
      methods: ["GET", "POST"],
    },
  });

  console.log("Socket.io initialized successfully");

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("joinCompany", (companyId) => {
      socket.join(`company_${companyId}`);
      console.log(`Socket ${socket.id} joined company ${companyId}`);
    });

    socket.on("leaveCompany", (companyId) => {
      socket.leave(`company_${companyId}`);
      console.log(`Socket ${socket.id} left company ${companyId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
