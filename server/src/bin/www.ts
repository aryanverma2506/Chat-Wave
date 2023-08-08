#!/usr/bin/env node

/**
 * Module dependencies.
 */
// import { Request } from "express-serve-static-core";
import debug from "debug";
import http from "http";
// import jwt from "jsonwebtoken";
// import * as WebSocket from "ws";
// import fs from "fs/promises";
// import { fileURLToPath } from "url";
// import { dirname } from "path";
debug("textract-upload:server");

// import { UserData } from "../middleware/auth-middleware.js";
// import storeMessage from "../util/store-message.js";
import mongooseConnect from "../config/database.js";
import socket from "../socket.js";
import app from "../app.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// interface WebSocketClient extends WebSocket {
//   // isAlive?: boolean;
//   // timer?: NodeJS.Timer;
//   // deathTimer?: NodeJS.Timeout;
//   userId?: string;
//   username?: string;
// }

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || 8080);
app.set("port", port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
mongooseConnect().then(() => {
  server.listen(port, () =>
    console.log(`Server is listening on http://localhost:${port}/`)
  );
  server.on("error", onError);
  server.on("listening", onListening);

  const io = socket.init(server);
  io.on("connection", (socket) => {
    console.log("Client Connected: ", socket.id);

    socket.on("disconnect", () => {
      console.log("Client Disconnected: ", socket.id);
    });

    socket.on(
      "setup connection",
      async (userId: string, friendsOfUser: string[]) => {
        await socket.join(userId);

        const onlineFriends: string[] = [];
        friendsOfUser.forEach((friendId: string) => {
          if (io.sockets.adapter.rooms.has(friendId)) {
            onlineFriends.push(friendId);
          }
        });
        socket.in(onlineFriends).emit("friend joined", userId); // This reduces the number of separate event emissions and may be more performant, especially if you have many online friends.
        socket.emit("online friends", onlineFriends);
      }
    );

    socket.on("join chat", (chatId) => {
      socket.join(chatId);
    });

    socket.on(
      "before disconnect",
      async (userId: string, friendsOfUser: string[]) => {
        await socket.leave(userId);
        try {
          if (!io.sockets.adapter.rooms.has(userId)) {
            socket.in(friendsOfUser).emit("friend left", userId);
          }
        } catch (error: any) {
          console.log(error.message);
        }
      }
    );

    socket.on("new message", (newMessageReceived) => {
      const chat = newMessageReceived.chat;

      // console.log(newMessageReceived);
      // console.log(newMessageReceived.chat.users);

      if (!chat.users) return console.log("chat.users not defined");

      chat.users.forEach((user: any) => {
        if (user === newMessageReceived.sender) return;

        socket.in(user).emit("message received", newMessageReceived);
      });
    });
  });
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(port: number | string): number | string | boolean {
  const parsedPort = parseInt(port.toString(), 10);

  if (isNaN(parsedPort)) {
    // Named pipe
    return port;
  }

  if (parsedPort >= 0) {
    // Port number
    return parsedPort;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: NodeJS.ErrnoException, port: number | string): void {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;
  debug("Listening on " + bind);
}
