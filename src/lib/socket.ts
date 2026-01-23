import { Server as IOServer } from "socket.io";

let io: IOServer | null = null;

export function initSocket(server: any) {
  if (!io) {
    io = new IOServer(server, {
      cors: {
        origin: "*",
      },
    });

    io.on("connection", (socket) => {
      console.log("🟢 Socket connected:", socket.id);
    });
  }

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
