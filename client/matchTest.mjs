import { io } from "socket.io-client";

const URL = "http://localhost:5000";

const connect = (label, token) => {
  const socket = io(URL, { auth: { token } });

  socket.on("connect_error", (e) => console.log(label, "REJECTED:", e.message));
  socket.on("queue:waiting", () => console.log(label, "waiting..."));
  socket.on("queue:error", (e) => console.log(label, "ERROR:", e.message));
  socket.on("match:found", (m) => {
    console.log(label, "MATCHED:", m);
    setTimeout(() => socket.emit("match:leave"), 500);
  });
  socket.on("match:ended", (m) => {
    console.log(label, "ENDED:", m.reason);
    socket.disconnect();
  });

  socket.on("connected", () => socket.emit("queue:join"));
  return socket;
};

connect("MALE", process.env.TOKEN_MALE);
setTimeout(() => connect("FEMALE", process.env.TOKEN_FEMALE), 1500);

setTimeout(() => process.exit(0), 8000);