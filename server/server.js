// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

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

app.get("/", (req, res) => {
  res.json({ message: "Smart Tourism API running..." });
});

// Public
app.use("/api/public/home", publicHomeRoutes);
app.use("/api/public/tours", publicToursRoutes);
app.use("/api/public/blogs", publicBlogsRoutes);

// Auth
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

// Socket.IO
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initChatSocket(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
