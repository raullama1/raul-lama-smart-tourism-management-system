// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";

import publicToursRoutes from "./routes/publicToursRoutes.js";
import publicHomeRoutes from "./routes/publicHomeRoutes.js";
import publicBlogsRoutes from "./routes/publicBlogsRoutes.js";

import authRoutes from "./routes/authRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import blogCommentsRoutes from "./routes/blogCommentsRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

import agencyAuthRoutes from "./routes/agencyAuthRoutes.js";
import agencySupportRoutes from "./routes/agencySupportRoutes.js";

import { initChatSocket } from "./sockets/chatSocket.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Serve uploaded images
app.use("/uploads", express.static(path.join(process.cwd(), "server", "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Smart Tourism API running..." });
});

// Public
app.use("/api/public/home", publicHomeRoutes);
app.use("/api/public/tours", publicToursRoutes);
app.use("/api/public/blogs", publicBlogsRoutes);

// Tourist Auth
app.use("/api/auth", authRoutes);

// Tourist features
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);

// Blogs (comments)
app.use("/api/blogs", blogCommentsRoutes);

// Chat REST
app.use("/api/chat", chatRoutes);

// Profile
app.use("/api/profile", profileRoutes);

// Notifications
app.use("/api/notifications", notificationRoutes);

// Agency Auth (MUST be before server starts)
app.use("/api/agency/auth", agencyAuthRoutes);

// Agency Support
app.use("/api/agency/support", agencySupportRoutes);

// Socket.IO
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io available to controllers if you need it later
app.set("io", io);

initChatSocket(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
