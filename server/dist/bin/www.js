#!/usr/bin/env node
import debug from "debug";
import http from "http";
import jwt from "jsonwebtoken";
import * as WebSocket from "ws";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";
debug("textract-upload:server");
import storeMessage from "../util/storeMessage.js";
import app from "../app.js";
import mongooseConnect from "../config/database.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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
    const wss = new WebSocket.WebSocketServer({ server: server });
    wss.on("connection", (connection, req) => {
        // notify everyone about online users (when someone connects)
        let notifyTimer;
        function notifyOnlineUsers() {
            clearTimeout(notifyTimer);
            [...wss.clients].forEach((client) => {
                client.send(JSON.stringify({
                    online: [...wss.clients].map((c) => ({
                        userId: c.userId,
                        username: c.username,
                    })),
                }));
            });
        }
        // connection.isAlive = true;
        // connection.timer = setInterval(() => {
        //   connection.ping();
        //   connection.deathTimer = setTimeout(() => {
        //     connection.isAlive = false;
        //     clearInterval(connection.timer);
        //     connection.terminate();
        //     notifyOnlineUsers();
        //     console.log("dead");
        //   });
        // }, 5000);
        // connection.on("pong", () => {
        //   clearTimeout(connection.deathTimer);
        // });
        // read username and id from the cookie for this connection
        const cookies = req.headers.cookie;
        if (cookies) {
            const token = cookies
                .split(",")
                .find((str) => str.startsWith("token="))
                ?.split("=")[1];
            if (token) {
                try {
                    const { userId, username } = jwt.verify(token, process.env.JWT_SECRET);
                    ;
                    connection.userId = userId;
                    connection.username = username;
                }
                catch (error) {
                    console.log(error);
                }
            }
            connection.on("message", async (message, isBinary) => {
                const messageData = JSON.parse(message.toString());
                const { recipient, formattedText, urlPreviewData, file } = messageData?.message;
                let filename;
                try {
                    if (file ||
                        urlPreviewData ||
                        (formattedText &&
                            (formattedText[0]?.insert?.trim() !== "\n" ||
                                formattedText.length > 1)))
                        if (file) {
                            filename = `${new Date().toISOString().replace(/:/g, "_")}-${file.name}`;
                            const path = __dirname + "../../../uploads/" + filename;
                            const bufferData = Buffer.from(file.data);
                            await fs.writeFile(path, bufferData);
                        }
                    if (recipient && connection.userId) {
                        const messageDoc = await storeMessage({
                            sender: connection.userId,
                            recipient: recipient,
                            formattedText: formattedText,
                            urlPreviewData: urlPreviewData,
                            filename: filename,
                        });
                        [...wss.clients]
                            .filter((c) => c.userId === recipient)
                            .forEach((client) => client.send(JSON.stringify({
                            messageId: messageDoc.id,
                            sender: connection.userId,
                            recipient: messageDoc.recipient,
                            urlPreviewData,
                            formattedText,
                            filename,
                        })));
                    }
                }
                catch (error) {
                    console.log(error);
                }
            });
        }
        notifyOnlineUsers();
        connection.on("close", (connection) => {
            clearTimeout(notifyTimer);
            notifyTimer = setTimeout(() => {
                notifyOnlineUsers();
            }, 3000);
        });
    });
    server.listen(port, () => console.log(`Server is listening on http://localhost:${port}/`));
    server.on("error", onError);
    server.on("listening", onListening);
});
/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(port) {
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
function onError(error, port) {
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
