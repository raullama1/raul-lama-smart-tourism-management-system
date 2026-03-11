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

import { initChatSocket } from "./sockets/chatSocket.js";

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
import adminTouristsRoutes from "./routes/adminTouristsRoutes.js";
import adminAgenciesRoutes from "./routes/adminAgenciesRoutes.js";
import adminPaymentsRoutes from "./routes/adminPaymentsRoutes.js";
import adminReviewsRoutes from "./routes/adminReviewsRoutes.js";
import adminReportsRoutes from "./routes/adminReportsRoutes.js";

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

app.use("/api/public/home", publicHomeRoutes);
app.use("/api/public/tours", publicToursRoutes);
app.use("/api/public/blogs", publicBlogsRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/wishlist", wishlistRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);

app.use("/api/blogs", blogCommentsRoutes);

app.use("/api/chat", chatRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/agency/auth", agencyAuthRoutes);
app.use("/api/agency/support", agencySupportRoutes);
app.use("/api/agency/dashboard", agencyDashboardRoutes);
app.use("/api/agency/tours", agencyToursRoutes);
app.use("/api/agency/bookings", agencyBookingsRoutes);
app.use("/api/agency/blogs", agencyBlogsRoutes);
app.use("/api/agency/reviews", agencyReviewsRoutes);
app.use("/api/agency/earnings", agencyEarningsRoutes);
app.use("/api/agency/profile", agencyProfileRoutes);

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/tourists", adminTouristsRoutes);
app.use("/api/admin/agencies", adminAgenciesRoutes);
app.use("/api/admin/payments", adminPaymentsRoutes);
app.use("/api/admin/reviews", adminReviewsRoutes);
app.use("/api/admin/reports", adminReportsRoutes);

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