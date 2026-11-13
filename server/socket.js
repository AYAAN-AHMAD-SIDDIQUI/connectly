import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { query } from "./db.js";
import {
  joinQueue,
  leaveQueue,
  endMatch,
  handleDisconnect,
  getPartnerSocket,
  getPartnerEntry
} from "./matchmaking.js";

const REPORT_REASONS = [
  "inappropriate",
  "harassment",
  "underage",
  "fake_gender",
  "other"
];

// Adds a block row unless this block already exists
const saveBlock = (blockerId, blockedId) =>
  query(
    `INSERT INTO blocks (blocker_id, blocked_id)
     SELECT $1::uuid, $2::uuid
     WHERE NOT EXISTS (
       SELECT 1 FROM blocks
       WHERE blocker_id = $1::uuid AND blocked_id = $2::uuid
     )`,
    [blockerId, blockedId]
  );

const saveReport = (reporterId, reportedId, reason) =>
  query(
    `INSERT INTO reports (reporter_id, reported_id, reason)
     VALUES ($1, $2, $3)`,
    [reporterId, reportedId, reason]
  );

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"]
    }
  });

  // Runs once for every new connection, before it is accepted
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (typeof token !== "string" || !token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const result = await query(
        `SELECT id, name, display_name, is_disabled,
                gender, gender_locked, is_adult_confirmed
         FROM users
         WHERE id = $1`,
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return next(new Error("User not found"));
      }

      const user = result.rows[0];

      if (user.is_disabled) {
        return next(new Error("Account disabled"));
      }

      socket.user = user;

      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: user ${socket.user.id}`);

    socket.emit("connected", {
      message: "Socket connected",
      userId: socket.user.id
    });

    socket.on("queue:join", async () => {
      try {
        await joinQueue(socket);
      } catch (error) {
        console.error("queue:join error:", error);
        socket.emit("queue:error", { message: "Could not start search" });
      }
    });

    socket.on("queue:leave", () => leaveQueue(socket));

    socket.on("match:leave", () => endMatch(socket));

    // Block the current partner and end the call
    socket.on("match:block", async (payload) => {
      const roomId = payload?.roomId;
      if (typeof roomId !== "string") return;

      const partner = getPartnerEntry(socket.user.id, roomId);
      if (!partner) return;

      let ok = true;
      try {
        await saveBlock(socket.user.id, partner.userId);
      } catch (error) {
        ok = false;
        console.error("block save failed:", error);
      }

      endMatch(socket);
      socket.emit("safety:result", { action: "block", ok });
    });

    // Report the current partner (also blocks) and end the call
    socket.on("match:report", async (payload) => {
      const roomId = payload?.roomId;
      const reason = payload?.reason;

      if (typeof roomId !== "string") return;
      if (!REPORT_REASONS.includes(reason)) {
        return socket.emit("safety:result", {
          action: "report",
          ok: false,
          message: "Please choose a valid reason"
        });
      }

      const partner = getPartnerEntry(socket.user.id, roomId);
      if (!partner) return;

      let ok = true;
      try {
        await saveReport(socket.user.id, partner.userId, reason);
      } catch (error) {
        ok = false;
        console.error("report save failed:", error);
      }

      try {
        await saveBlock(socket.user.id, partner.userId);
      } catch (error) {
        console.error("block save failed:", error);
      }

      endMatch(socket);
      socket.emit("safety:result", { action: "report", ok });
    });

    // Relay WebRTC signaling (offer / answer / ICE) to the partner only
    socket.on("webrtc:signal", (payload) => {
      if (!payload || typeof payload !== "object") return;

      const { roomId, data } = payload;

      if (typeof roomId !== "string" || !data || typeof data !== "object") {
        return;
      }

      // Reject oversized messages
      if (JSON.stringify(data).length > 20000) return;

      const partner = getPartnerSocket(socket.user.id, roomId);
      if (!partner) return;

      partner.emit("webrtc:signal", { roomId, data });
    });

    socket.on("disconnect", () => {
      handleDisconnect(socket);
      console.log(`Socket disconnected: user ${socket.user.id}`);
    });
  });

  return io;
};