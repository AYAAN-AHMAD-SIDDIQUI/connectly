import { io } from "socket.io-client";

export const connectSocket = (token) => {
  return io(import.meta.env.VITE_API_URL, {
    auth: { token },
  });
};