import { Server } from "http";
import { Server as SocketIoServer } from "socket.io";

let io: SocketIoServer;

const allowedOrigins = process.env.CLIENT_URLS?.split(",").map((url) =>
  url.trim()
);

export default {
  init: (httpServer: Server): SocketIoServer => {
    io = new SocketIoServer(httpServer, {
      cors: {
        origin: allowedOrigins,
      },
    });
    return io;
  },
  getIo: (): SocketIoServer => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
