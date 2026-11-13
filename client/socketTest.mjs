import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: { token: process.env.TEST_TOKEN || "" }
});

socket.on("connected", (data) => {
  console.log("SUCCESS:", data);
  socket.disconnect();
});

socket.on("connect_error", (err) => {
  console.log("REJECTED:", err.message);
  socket.disconnect();
});