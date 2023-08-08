import openSocket from "socket.io-client";

const socket = openSocket(process.env.REACT_APP_SERVER_URL!, {
  autoConnect: true,
  reconnection: true, // Enable automatic reconnection
  reconnectionAttempts: Infinity, // Number of reconnection attempts before giving up
  reconnectionDelay: 10000, // Delay between reconnection attempts (in milliseconds)
  // withCredentials: true, // Send cookies from the client to the server
});

export default socket;
