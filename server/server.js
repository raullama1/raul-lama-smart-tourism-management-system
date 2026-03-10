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
import agencyDashboardRoutes from "./routes/agencyDashboardRoutes.js";
import agencyToursRoutes from "./routes/agencyToursRoutes.js";
import agencyBookingsRoutes from "./routes/agencyBookingsRoutes.js";
import agencyBlogsRoutes from "./routes/agencyBlogsRoutes.js";
import agencyReviewsRoutes from "./routes/agencyReviewsRoutes.js";
import agencyEarningsRoutes from "./routes/agencyEarningsRoutes.js";
import agencyProfileRoutes from "./routes/agencyProfileRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";

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

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "server", "uploads"))
);

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

// Blogs
app.use("/api/blogs", blogCommentsRoutes);

// Chat REST
app.use("/api/chat", chatRoutes);

// Profile
app.use("/api/profile", profileRoutes);

// Notifications
app.use("/api/notifications", notificationRoutes);

// Agency Auth
app.use("/api/agency/auth", agencyAuthRoutes);

// Agency Support
app.use("/api/agency/support", agencySupportRoutes);

// Agency Dashboard
app.use("/api/agency/dashboard", agencyDashboardRoutes);

// Agency Tours
app.use("/api/agency/tours", agencyToursRoutes);

// Agency Bookings
app.use("/api/agency/bookings", agencyBookingsRoutes);

// Agency Blogs
app.use("/api/agency/blogs", agencyBlogsRoutes);

// Agency Reviews
app.use("/api/agency/reviews", agencyReviewsRoutes);

// Agency Earnings
app.use("/api/agency/earnings", agencyEarningsRoutes);

// Agency Profile
app.use("/api/agency/profile", agencyProfileRoutes);

// Admin Auth
app.use("/api/admin/auth", adminAuthRoutes);

// Admin Dashboard
app.use("/api/admin/dashboard", adminDashboardRoutes);

// Socket.IO
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

initChatSocket(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));