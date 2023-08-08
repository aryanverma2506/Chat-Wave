import { Server as SocketIoServer } from "socket.io";
let io;
const allowedOrigins = process.env.CLIENT_URLS?.split(",").map((url) => url.trim());
export default {
    init: (httpServer) => {
        io = new SocketIoServer(httpServer, {
            cors: {
                origin: allowedOrigins,
            },
        });
        return io;
    },
    getIo: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    },
};
