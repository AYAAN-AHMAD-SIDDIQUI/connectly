import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import { testDatabase } from "./db.js";
import authRoutes from "./routes/auth.js";
import connectionRoutes from "./routes/connections.js";
import adminRoutes from "./routes/admin.js";
import { initSocket } from "./socket.js";
import { authenticate } from "./middleware/auth.js";

dotenv.config({ path: "./server/.env" });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "20kb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

// Return ICE server settings only to authenticated users. TURN credentials are
// delivered to the browser because WebRTC peers need them to establish relay paths.
app.get("/ice-config", authenticate, (req, res) => {
  const username = process.env.METERED_TURN_USERNAME;
  const credential = process.env.METERED_TURN_CREDENTIAL;

  const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

  if (username && credential) {
    iceServers.push({
      urls: [
        "turn:global.relay.metered.ca:80",
        "turn:global.relay.metered.ca:80?transport=tcp"
      ],
      username,
      credential
    });
  }

  res.json({ iceServers });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Connectly API"
  });
});

// Authentication routes
app.use("/auth", authLimiter, authRoutes);

// Connection routes
app.use("/connections", connectionRoutes);

// Admin routes (admin only)
app.use("/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: "Internal server error"
  });
});

// Express and Socket.IO share one HTTP server
const server = http.createServer(app);
initSocket(server);

const startServer = async () => {
  try {
    await testDatabase();

    server.listen(PORT, () => {
      console.log(`Connectly API running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();